# controllers/voice_orchestrator.py

import os
import sys
import json
import base64
import asyncio
from typing import Dict, Any, List
from fastapi import WebSocket
from sqlalchemy.orm import sessionmaker
import websockets
import openai
import pinecone

# Reconfigure stdout/stderr to support Unicode characters in Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.models.campaign import Campaign
from app.models.lead import Lead, LeadStatus
from app.models.tenant import Tenant
from app.models.call_log import CallLog
from app.models.prompt_version import PromptVersion
from app.models.tool_schema import ToolSchema
from app.models.blacklist import BlacklistedNumber
from app.utils.pubsub import publish_sync
from app.config.settings import settings

# Load API keys from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY") or os.getenv("OPENAI_API_KEY") # fallback to openai key if same provider or debug
ELEVENLABS_API_KEY = os.getenv("elevenlabs") or os.getenv("ELEVENLABS_API_KEY")

async def search_knowledge_base(query: str, tenant_id: str) -> str:
    """
    Search the tenant's Pinecone knowledge base (RAG).
    Generates text-embedding vector using Gemini or OpenAI and performs top-k lookup.
    """
    if not settings.PINECONE_API_KEY:
        return "Pinecone search is currently unavailable. No context found."
        
    try:
        # 1. Generate Query Embeddings & Determine Index Name
        if settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            response = await asyncio.to_thread(
                genai.embed_content,
                model="models/gemini-embedding-001",
                content=query
            )
            query_vector = response['embedding']
            index_name = "ai-bot-index-gemini"
        else:
            client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
            emb_res = await client.embeddings.create(
                input=query,
                model="text-embedding-3-small"
            )
            query_vector = emb_res.data[0].embedding
            index_name = settings.PINECONE_INDEX_NAME or "ai-bot-index"
        
        # 2. Query Pinecone Scoped Namespace
        pc = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(index_name)
        
        res = index.query(
            vector=query_vector,
            namespace=str(tenant_id),
            top_k=2,
            include_metadata=True
        )
        
        contexts = []
        for match in res.matches:
            if "text" in match.metadata:
                contexts.append(match.metadata["text"])
                
        if contexts:
            return "\n\n".join(contexts)
        return "No relevant information found in the knowledge base."
    except Exception as e:
        print(f"[RAG ERROR] Pinecone query failed: {str(e)}")
        return "Error querying knowledge base."

def convert_schema_to_gemini(schema: dict) -> dict:
    if not isinstance(schema, dict):
        return schema
    
    new_schema = {}
    for k, v in schema.items():
        if k == "type" and isinstance(v, str):
            new_schema[k] = v.upper()
        elif isinstance(v, dict):
            new_schema[k] = convert_schema_to_gemini(v)
        elif isinstance(v, list):
            new_schema[k] = [convert_schema_to_gemini(item) if isinstance(item, dict) else item for item in v]
        else:
            new_schema[k] = v
    return new_schema

async def execute_tool(
    name: str,
    arguments: dict,
    tenant_id: str,
    lead_id: str,
    db_session_factory
) -> str:
    """
    Execute a dynamic tool call and return the result as a string.
    """
    import uuid
    if isinstance(tenant_id, str):
        tenant_id = uuid.UUID(tenant_id)
    if isinstance(lead_id, str):
        lead_id = uuid.UUID(lead_id)

    db = db_session_factory()
    try:
        if name == "search_knowledge":
            query = arguments.get("query", "")
            # Close db session before async search to free database connection
            db.close()
            return await search_knowledge_base(query, tenant_id)
            
        elif name == "book_callback":
            date = arguments.get("date")
            time = arguments.get("time")
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead:
                existing_notes = lead.notes or ""
                new_note = f"[CALLBACK BOOKED: {date} at {time}]"
                lead.notes = f"{new_note}\n{existing_notes}" if existing_notes else new_note
                db.commit()
                return f"Callback scheduled successfully for {date} at {time}."
            return "Failed to schedule callback: Lead not found."
            
        elif name == "calculate_premium":
            age = int(arguments.get("age", 30))
            policy_type = arguments.get("policy_type", "term")
            coverage = float(arguments.get("coverage_amount", 500000))
            
            base_rate = 10 if policy_type == "term" else (15 if policy_type == "health" else 20)
            age_factor = 1.0 + max(0, (age - 18) * 0.05)
            monthly_premium = round((coverage / 100000) * base_rate * age_factor, 2)
            
            return f"The estimated monthly premium for a {policy_type} policy with {coverage} coverage for a {age}-year-old is ${monthly_premium}."
            
        elif name == "update_lead_status":
            status_val = arguments.get("status")
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead:
                lead.status = status_val
                db.commit()
                return f"Lead status updated to '{status_val}' successfully."
            return "Failed to update status: Lead not found."
            
        elif name == "blacklist_number":
            phone = arguments.get("phone")
            reason = arguments.get("reason", "Opt-out")
            
            existing = db.query(BlacklistedNumber).filter(
                BlacklistedNumber.tenant_id == tenant_id,
                BlacklistedNumber.phone == phone
            ).first()
            
            if not existing:
                blacklisted = BlacklistedNumber(
                    tenant_id=tenant_id,
                    phone=phone,
                    reason=reason
                )
                db.add(blacklisted)
                
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead:
                lead.status = LeadStatus.NOT_INTERESTED
                
            db.commit()
            return f"Phone number {phone} blacklisted successfully. Reason: {reason}."
            
        else:
            return f"Unknown tool name: {name}."
    except Exception as e:
        db.rollback()
        return f"Error executing tool {name}: {str(e)}"
    finally:
        try:
            db.close()
        except Exception:
            pass

async def query_gpt4o_dialogue(
    user_text: str,
    conversation_history: List[Dict[str, str]],
    system_prompt: str,
    tenant_id: str,
    lead_id: str,
    db_session_factory
) -> tuple[str, bool]:
    """
    Query Gemini or GPT-4o dialogue agent. If user asks an insurance/course/technical question,
    dynamically triggers a Pinecone RAG search before yielding responses.
    Additionally support dynamic tool calling/function registration from DB.
    """
    # Simple semantic rule: if the user query contains question words, do a quick Pinecone search
    question_keywords = [
        "syllabus", "fee", "price", "cost", "course", "admission", "duration", 
        "class", "react", "python", "insurance", "plan", "premium", "policy",
        "bima", "jeevan", "kya", "hota", "insuranse", "bheema", "fayde", 
        "benefits", "tax", "claim", "offline", "online", "difference", "what"
    ]
    is_question = any(word in user_text.lower() for word in question_keywords)
    
    rag_context = ""
    if is_question:
        print(f"[RAG PROMPT] Querying knowledge base for user text: {user_text}")
        rag_context = await search_knowledge_base(user_text, tenant_id)
        
    augmented_system_prompt = system_prompt
    if rag_context:
        augmented_system_prompt += f"\n\n[RELEVANT KNOWLEDGE BASE CONTEXT]:\n{rag_context}\n\nEnforce rules: Use only facts from this context to answer questions. If not present, state that a senior advisor will call back with details."

    # Load active tools for this tenant
    db = db_session_factory()
    active_tools = []
    try:
        active_tools = db.query(ToolSchema).filter(
            ToolSchema.tenant_id == tenant_id,
            ToolSchema.is_active == True
        ).all()
    except Exception as e:
        print(f"[LLM TOOL WARNING] Failed to load tool schemas: {e}")
    finally:
        db.close()

    # Format tools for OpenAI
    openai_tools = []
    for tool in active_tools:
        openai_tools.append({
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description or "",
                "parameters": tool.json_schema
            }
        })

    # Format tools for Gemini
    gemini_tools = []
    for tool in active_tools:
        gemini_tools.append({
            "function_declarations": [
                {
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": convert_schema_to_gemini(tool.json_schema)
                }
            ]
        })

    if settings.GEMINI_API_KEY:
        import google.generativeai as genai
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Convert messages to Gemini format:
            contents = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [msg["content"]]})
            contents.append({"role": "user", "parts": [user_text]})

            models_to_try = [
                'models/gemini-3.1-flash-lite',
                'models/gemini-3-flash-preview',
                'models/gemini-2.5-flash',
                'models/gemini-2.0-flash',
                'models/gemini-2.5-flash-lite',
                'models/gemini-2.0-flash-lite',
                'models/gemini-3.5-flash'
            ]
            
            for model_name in models_to_try:
                try:
                    model_kwargs = {
                        "model_name": model_name,
                        "system_instruction": augmented_system_prompt
                    }
                    if gemini_tools:
                        model_kwargs["tools"] = gemini_tools
                        
                    model = genai.GenerativeModel(**model_kwargs)
                    current_contents = list(contents)
                    
                    max_gemini_turns = 3
                    for g_turn in range(max_gemini_turns):
                        response = await asyncio.to_thread(
                            model.generate_content,
                            current_contents,
                            generation_config={"temperature": 0.7}
                        )
                        
                        if response.candidates and response.candidates[0].content.parts:
                            part = response.candidates[0].content.parts[0]
                            
                            # Check for function call
                            if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                                name = part.function_call.name
                                args = dict(part.function_call.args)
                                print(f"[GEMINI TOOL CALL] Executing tool: {name} with arguments: {args}")
                                
                                tool_res = await execute_tool(name, args, tenant_id, lead_id, db_session_factory)
                                print(f"[GEMINI TOOL RESULT] Tool {name} returned: {tool_res}")
                                
                                current_contents.append(response.candidates[0].content)
                                current_contents.append({
                                    "role": "user",
                                    "parts": [{
                                        "function_response": {
                                            "name": name,
                                            "response": {"result": tool_res}
                                        }
                                    }]
                                })
                                continue
                            else:
                                assistant_reply = response.text
                                print(f"[LLM AGENT] Gemini succeeded with model: {model_name}")
                                return assistant_reply, is_question
                        else:
                            break
                    raise Exception("Gemini tool loop run out of turns.")
                except Exception as model_err:
                    print(f"[LLM WARNING] Gemini failed for model {model_name}: {str(model_err)}")
                    if "429" not in str(model_err) and "quota" not in str(model_err).lower():
                        break
            raise Exception("All Gemini models failed or rate-limited.")
        except Exception as e:
            print(f"[LLM ERROR] Gemini pipeline failed: {str(e)}")
            
    # Fallback to OpenAI if Gemini is not available or failed
    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    messages = [{"role": "system", "content": augmented_system_prompt}] + conversation_history
    messages.append({"role": "user", "content": user_text})
    
    max_turns = 3
    for turn in range(max_turns):
        try:
            kwargs = {
                "model": "gpt-4o",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 250
            }
            if openai_tools:
                kwargs["tools"] = openai_tools
                kwargs["tool_choice"] = "auto"
                
            response = await client.chat.completions.create(**kwargs)
            message = response.choices[0].message
            
            if not message.tool_calls:
                return message.content or "I didn't catch that.", is_question
                
            messages.append(message)
            for tool_call in message.tool_calls:
                name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                print(f"[OPENAI TOOL CALL] Executing tool: {name} with arguments: {args}")
                tool_res = await execute_tool(name, args, tenant_id, lead_id, db_session_factory)
                print(f"[OPENAI TOOL RESULT] Tool {name} returned: {tool_res}")
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": name,
                    "content": tool_res
                })
        except Exception as e:
            print(f"[LLM ERROR] GPT-4o call or tool execution failed: {str(e)}")
            return "I am sorry, I am having trouble connecting right now.", False
            
    return "I am sorry, I am having trouble connecting right now.", False

async def handle_media_stream(twilio_ws: WebSocket, db_session_factory):
    """
    Main orchestrator handling Twilio audio stream WebSocket connections.
    """
    stream_sid = None
    campaign_id = None
    lead_id = None
    tenant_id = None
    selected_language = "english"
    
    conversation_history = []
    active_tts_tasks = []
    
    # 1. Wait for Twilio handshake connection START event
    try:
        async for message in twilio_ws.iter_text():
            packet = json.loads(message)
            event_type = packet.get("event")
            
            if event_type == "start":
                stream_sid = packet["streamSid"]
                custom_params = packet["start"].get("customParameters", {})
                campaign_id = custom_params.get("campaign_id")
                lead_id = custom_params.get("lead_id")
                selected_language = custom_params.get("language", "english")
                print(f"[TELEPHONY] Call started. StreamSid={stream_sid}, campaign={campaign_id}, lead={lead_id}, language={selected_language}")
                break
    except Exception as e:
        print(f"[TELEPHONY ERROR] Handshake read failed: {str(e)}")
        return

    if not campaign_id or not lead_id:
        print("[TELEPHONY ERROR] Missing campaign_id or lead_id custom parameters.")
        return

    # 2. Setup Database Session & Load configurations
    db = db_session_factory()
    try:
        campaign = None
        if campaign_id and campaign_id != "single-call":
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            print("[TELEPHONY ERROR] Lead not found in DB.")
            return
            
        if campaign_id != "single-call" and not campaign:
            print("[TELEPHONY ERROR] Campaign not found in DB.")
            return
            
        tenant_id = campaign.tenant_id if campaign else lead.tenant_id
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        # Load system prompts & voices
        db_prompt = db.query(PromptVersion).filter(
            PromptVersion.tenant_id == tenant_id,
            PromptVersion.is_active == True
        ).first()
        system_prompt = db_prompt.prompt_text if db_prompt else (tenant.system_prompt if tenant else "You are Neha, an admissions advisor at CoderVu.")
        
        # Resolve language: check tenant settings first, otherwise fallback to Twilio parameter
        if tenant and tenant.settings and "default_language" in tenant.settings:
            selected_language = tenant.settings["default_language"]
            
        # Inject dynamic language rules
        if selected_language == "auto":
            system_prompt += "\n\n[LANGUAGE RULE]: Conversational Language: Dynamic Multilingual (Hindi/English). You must dynamically detect the language of the user's query. If the user speaks or asks in Hindi or Hinglish, you must respond in Hindi/Hinglish (using Devanagari script or Hinglish script as preferred by the user). If the user speaks or asks in English, you must respond in English. Do not mix languages in a single sentence unless the user does so (speak in pure natural Hindi or pure natural English depending on their input)."
        elif selected_language == "hindi":
            system_prompt += "\n\n[LANGUAGE RULE]: Conversational Language: Hindi. You must speak in natural Hindi (using Devanagari script or Hinglish as preferred by the user). Answer queries in Hindi only."
        else:
            system_prompt += "\n\n[LANGUAGE RULE]: Conversational Language: English. You must speak in clear English. Answer queries in English only."

        voice_id = tenant.voice_id if (tenant and tenant.voice_id) else "cgSgspJ2msm6clMCkdW9" # Jessica default
    finally:
        db.close()

    # 3. Establish Deepgram STT websocket client
    dg_url = "wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1"
    if selected_language == "auto":
        if tenant and tenant.timezone == "Asia/Kolkata":
            dg_url += "&model=nova-2&language=hi"
        else:
            dg_url += "&model=nova-2&language=multi"
    elif selected_language == "hindi":
        dg_url += "&model=nova-2&language=hi"
    elif selected_language == "english":
        dg_url += "&model=nova-2&language=en"
        
    dg_headers = {"Authorization": f"Token {DEEPGRAM_API_KEY}"}

    try:
        async with websockets.connect(dg_url, additional_headers=dg_headers) as dg_ws:
            
            print("[TELEPHONY] Integrations connected successfully. Ready to stream.")

            # Trigger dynamic welcome greeting based on prompt persona and chosen language
            user_name = lead.name if lead else "there"
            company_name = tenant.company_name if (tenant and tenant.company_name) else "SecureLife Insurance"
            agent_name = "Rohan" if "Rohan" in system_prompt else ("Neha" if "Neha" in system_prompt else "AI")

            if selected_language == "auto" or selected_language == "hindi":
                greeting = f"Hello, namaste! Kya main {user_name} se baat kar raha hoon? Main {agent_name} bol raha hoon, {company_name} se. Main aapko disturb toh nahi kar raha? 30 seconds ka time milega? Aapke liye ek insurance plan ke baare me short information share karni thi jo aapke liye useful ho sakti hai."
            else:
                greeting = f"Hello! Am I speaking with {user_name}? I am {agent_name} from {company_name}. Hope I am not disturbing you. Do you have 30 seconds? I wanted to share some quick information about an insurance plan that could be useful for you."
                
            print(f"[TELEPHONY] Sending initial greeting: {greeting}")
            tts_task = asyncio.create_task(render_tts_and_send_to_twilio(greeting, voice_id, twilio_ws, stream_sid))
            active_tts_tasks.append(tts_task)
            conversation_history.append({"role": "assistant", "content": greeting})
            
            # Helper: Forward Twilio Inbound call audio to Deepgram
            async def forward_audio_to_deepgram():
                try:
                    async for message in twilio_ws.iter_text():
                        packet = json.loads(message)
                        if packet.get("event") == "media":
                            payload = packet["media"]["payload"]
                            raw_audio = base64.b64decode(payload)
                            await dg_ws.send(raw_audio)
                        elif packet.get("event") == "stop":
                            print("[TELEPHONY] Stop event received from Twilio.")
                            break
                except Exception as e:
                    print(f"[TELEPHONY] Audio forward task exception: {str(e)}")

            # Helper: Listen for transcripts from Deepgram, query LLM and pipe back to TTS
            async def process_transcripts():
                nonlocal conversation_history
                try:
                    async for message in dg_ws:
                        res = json.loads(message)
                        transcript = res.get("channel", {}).get("alternatives", [{}])[0].get("transcript", "")
                        is_final = res.get("is_final", False)
                        
                        if transcript and is_final:
                            print(f"[STT USER]: {transcript}")
                            
                            # Publish transcript updates to Live UI Websockets
                            publish_sync(f"campaign:{campaign_id}:lead:{lead_id}", {
                                "speaker": "User",
                                "text": transcript
                            })
                            
                            # Barge-in interruption handler: Flush Twilio playback buffer immediately
                            if active_tts_tasks:
                                print("[BARGE-IN] User interrupted AI. Flushing Twilio audio buffer and canceling tasks.")
                                clear_cmd = {"event": "clear", "streamSid": stream_sid}
                                await twilio_ws.send_json(clear_cmd)
                                for task in active_tts_tasks:
                                    if not task.done():
                                        task.cancel()
                                active_tts_tasks.clear()
                            
                            # Query GPT-4o dialogue controller
                            reply, was_rag = await query_gpt4o_dialogue(
                                transcript,
                                conversation_history,
                                system_prompt,
                                tenant_id,
                                lead_id,
                                db_session_factory
                            )
                            print(f"[LLM AGENT]: {reply}")
                            
                            # Save history turn
                            conversation_history.append({"role": "user", "content": transcript})
                            conversation_history.append({"role": "assistant", "content": reply})
                            
                            # Publish transcript updates to Live UI
                            publish_sync(f"campaign:{campaign_id}:lead:{lead_id}", {
                                "speaker": "AI",
                                "text": reply
                            })
                            
                            # Dispatch ElevenLabs TTS rendering tasks in background
                            tts_task = asyncio.create_task(render_tts_and_send_to_twilio(reply, voice_id, twilio_ws, stream_sid))
                            active_tts_tasks.append(tts_task)
                            
                except Exception as e:
                    print(f"[STT PROCESSOR] Transcript exception: {str(e)}")

            # Execute STT forwarding & transcript loops concurrently
            stt_task = asyncio.create_task(forward_audio_to_deepgram())
            llm_task = asyncio.create_task(process_transcripts())
            
            await asyncio.gather(stt_task, llm_task)
            
    except Exception as e:
        print(f"[TELEPHONY ORCHESTRATOR ERROR] Error in WS media loops: {str(e)}")
    finally:
        # Save Call Logs to database on completion
        await save_telephony_call_log(db_session_factory, tenant_id, campaign_id, lead_id, conversation_history)

async def render_tts_and_send_to_twilio(text: str, voice_id: str, twilio_ws: WebSocket, stream_sid: str):
    """
    Pipes text segments to ElevenLabs, reads returned Mu-law audio, 
    and sends Base64 media packets to Twilio call socket.
    """
    import websockets
    
    el_url = f"wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?output_format=ulaw_8000"
    el_headers = {"xi-api-key": ELEVENLABS_API_KEY}
    
    try:
        async with websockets.connect(el_url, additional_headers=el_headers) as el_ws:
            # Send initial ElevenLabs setup configurations with multilingual model support
            await el_ws.send(json.dumps({
                "text": " ",
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
                "xi_api_key": ELEVENLABS_API_KEY
            }))
            
            # Send text to ElevenLabs
            await el_ws.send(json.dumps({
                "text": f"{text} ",
                "try_trigger_generation": True
            }))
            
            # Send empty text to indicate end of transmission for this utterance
            await el_ws.send(json.dumps({
                "text": ""
            }))
            
            # Read synthesized audio frames from ElevenLabs
            while True:
                response = await el_ws.recv()
                data = json.loads(response)
                
                # Extract raw audio
                audio_base64 = data.get("audio")
                if audio_base64:
                    # Pipe media payload directly to Twilio
                    media_payload = {
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {
                            "payload": audio_base64
                        }
                    }
                    await twilio_ws.send_json(media_payload)
                    
                # If transmission complete break
                if data.get("isFinal", False):
                    break
    except asyncio.CancelledError:
        print("[TTS CANCELLED] Render task cancelled due to barge-in.")
    except Exception as e:
        print(f"[TTS RENDER ERROR] Exception in ElevenLabs pipe: {str(e)}")

async def save_telephony_call_log(
    db_session_factory,
    tenant_id: str,
    campaign_id: str,
    lead_id: str,
    conversation_history: List[Dict[str, str]]
):
    """
    Create a call log with the final dialog history summary.
    """
    if not conversation_history:
        return
        
    db = db_session_factory()
    try:
        # Convert list of role/content items to dialog format list
        transcript_data = [
            {"speaker": "User" if turn["role"] == "user" else "AI", "text": turn["content"]}
            for turn in conversation_history
        ]
        
        # Select simple classification tags based on history length
        is_converted = any("visit" in turn["content"].lower() or "demo" in turn["content"].lower() for turn in conversation_history)
        
        # Generate summary
        summary = "Qualified admissions inquiry."
        if is_converted:
            summary = "Admissions call completed. Booked python syllabus site visit."
            
        db_log = CallLog(
            tenant_id=tenant_id,
            lead_id=lead_id,
            campaign_id=None if campaign_id == "single-call" else campaign_id,
            call_duration=len(conversation_history) * 6, # approximate duration
            call_disposition="Answered",
            recording_url=f"https://s3.amazonaws.com/ai-bot-recordings/call_{lead_id}.mp3",
            ai_summary=summary,
            intent_tag="Warm Lead" if is_converted else "Cold Call",
            transcript=transcript_data
        )
        
        # Update Lead Status
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            lead.status = LeadStatus.CONVERTED if is_converted else LeadStatus.NEEDS_FOLLOW_UP
            lead.call_disposition = "Answered"
            
        db.add(db_log)
        db.commit()
        print(f"[TELEPHONY] Successfully saved CallLog for lead={lead_id} to database.")
    except Exception as e:
        db.rollback()
        print(f"[TELEPHONY] Failed to save CallLog: {str(e)}")
    finally:
        db.close()
