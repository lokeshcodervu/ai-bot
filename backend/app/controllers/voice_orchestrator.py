# controllers/voice_orchestrator.py

import os
import sys
import json
import re
import base64
import asyncio
import time
from typing import Dict, Any, List
from fastapi import WebSocket
from sqlalchemy.orm import sessionmaker
import websockets
import openai
import pinecone

# Safe print to prevent UnicodeEncodeError on Windows consoles when logging unicode characters
_original_print = print
def safe_print(*args, **kwargs):
    new_args = []
    encoding = getattr(sys.stdout, 'encoding', 'utf-8') or 'utf-8'
    for arg in args:
        if isinstance(arg, str):
            try:
                arg.encode(encoding)
                new_args.append(arg)
            except UnicodeEncodeError:
                new_args.append(arg.encode(encoding, errors='replace').decode(encoding))
        else:
            new_args.append(arg)
    try:
        _original_print(*new_args, **kwargs)
    except Exception:
        pass

print = safe_print

class CallTurnLatencyTracker:
    def __init__(self):
        self.stt_finalized_time = 0.0
        self.llm_start_time = 0.0
        self.first_token_time = 0.0
        self.first_audio_time = 0.0
        self.logged_this_turn = True
        
    def start_turn(self):
        self.stt_finalized_time = time.perf_counter()
        self.llm_start_time = time.perf_counter()
        self.first_token_time = 0.0
        self.first_audio_time = 0.0
        self.logged_this_turn = False
        
    def record_first_token(self):
        if self.first_token_time == 0.0:
            self.first_token_time = time.perf_counter()
            
    def record_first_audio(self):
        if not self.logged_this_turn and self.first_audio_time == 0.0:
            self.first_audio_time = time.perf_counter()
            total_latency = (self.first_audio_time - self.stt_finalized_time) * 1000
            llm_ttft = (self.first_token_time - self.llm_start_time) * 1000 if self.first_token_time > 0.0 else 0.0
            tts_latency = (self.first_audio_time - self.first_token_time) * 1000 if self.first_token_time > 0.0 else 0.0
            
            print(f"\n=======================================================")
            print(f"[LATENCY DIAGNOSTICS REPORT]")
            print(f"  - LLM TTFT (Time-to-First-Token) : {llm_ttft:.2f}ms")
            print(f"  - TTS Generation (TTFT to Audio)  : {tts_latency:.2f}ms")
            print(f"  - Total Pipeline Start Latency    : {total_latency:.2f}ms")
            print(f"=======================================================\n")
            sys.stdout.flush()
            self.logged_this_turn = True

class PersistentElevenLabsTTS:
    def __init__(self, voice_id: str, elevenlabs_key: str, latency_tracker: CallTurnLatencyTracker = None):
        self.voice_id = voice_id
        self.elevenlabs_key = elevenlabs_key
        self.latency_tracker = latency_tracker
        self.el_ws = None
        self.current_stream_sid = None
        self.twilio_ws = None
        self.is_connected = False
        self.connect_task = None
        self._lock = asyncio.Lock()

    async def connect(self):
        async with self._lock:
            if self.is_connected and self.el_ws:
                return
            el_url = f"wss://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/stream-input?output_format=ulaw_8000"
            el_headers = {"xi-api-key": self.elevenlabs_key or ""}
            try:
                self.el_ws = await websockets.connect(el_url, additional_headers=el_headers)
                await self.el_ws.send(json.dumps({
                    "text": " ",
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.4, "similarity_boost": 0.6, "style": 0.7},
                    "xi_api_key": self.elevenlabs_key or ""
                }))
                self.is_connected = True
                print("[PERSISTENT TTS] ElevenLabs WebSocket connected successfully.")
                sys.stdout.flush()
            except Exception as e:
                print(f"[PERSISTENT TTS ERROR] Connection failed: {e}")
                sys.stdout.flush()
                self.is_connected = False
                self.el_ws = None

    async def close(self):
        ws_to_close = None
        async with self._lock:
            if self.el_ws:
                ws_to_close = self.el_ws
                self.el_ws = None
            self.is_connected = False

        if ws_to_close:
            try:
                await ws_to_close.send(json.dumps({"text": ""}))
                await asyncio.wait_for(ws_to_close.close(), timeout=1.0)
            except Exception:
                pass

    async def flush(self):
        print("[PERSISTENT TTS] Flushing ElevenLabs session due to user interruption...")
        sys.stdout.flush()
        await self.close()
        # Trigger background reconnection
        self.connect_task = asyncio.create_task(self.connect())

    async def listen_loop(self, twilio_ws: WebSocket, stream_sid: str):
        self.twilio_ws = twilio_ws
        self.current_stream_sid = stream_sid
        while True:
            try:
                # If we're disconnected or not initialized, wait briefly
                if not self.is_connected or not self.el_ws:
                    await asyncio.sleep(0.05)
                    continue
                
                current_ws = self.el_ws
                async for response in current_ws:
                    data = json.loads(response)
                    audio_base64 = data.get("audio")
                    if audio_base64:
                        if self.latency_tracker:
                            self.latency_tracker.record_first_audio()
                        media_payload = {
                            "event": "media",
                            "streamSid": self.current_stream_sid,
                            "media": {
                                "payload": audio_base64
                            }
                        }
                        await self.twilio_ws.send_json(media_payload)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[PERSISTENT TTS LISTEN LOOP ERROR/CLOSE]: {e}")
                sys.stdout.flush()
                async with self._lock:
                    if self.el_ws == current_ws:
                        self.is_connected = False
                        self.el_ws = None
                await asyncio.sleep(0.1)

class PersistentSarvamTTS:
    def __init__(self, voice_id: str, sarvam_key: str, latency_tracker: CallTurnLatencyTracker = None, is_female: bool = True, pace: float = 1.2):
        self.voice_id = voice_id
        self.sarvam_key = sarvam_key
        self.latency_tracker = latency_tracker
        self.is_female = is_female
        self.pace = pace
        self.sarvam_ws = None
        self.current_stream_sid = None
        self.twilio_ws = None
        self.is_connected = False
        self.connect_task = None
        self._lock = asyncio.Lock()

    async def connect(self):
        async with self._lock:
            if self.is_connected and self.sarvam_ws:
                return
            url = "wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3"
            headers = {
                "api-subscription-key": self.sarvam_key
            }
            try:
                self.sarvam_ws = await websockets.connect(url, additional_headers=headers)
                speaker = map_to_sarvam_speaker(self.voice_id, self.is_female)
                # Send config message immediately with fast speaking pace (1.2x)
                await self.sarvam_ws.send(json.dumps({
                    "type": "config",
                    "data": {
                        "target_language_code": "hi-IN",
                        "speaker": speaker,
                        "model": "bulbul:v3",
                        "speech_sample_rate": 8000,
                        "output_audio_codec": "mulaw",
                        "pace": self.pace
                    }
                }))
                self.is_connected = True
                print(f"[PERSISTENT SARVAM] Connected successfully with speaker '{speaker}' (is_female={self.is_female}).")
                sys.stdout.flush()
            except Exception as e:
                print(f"[PERSISTENT SARVAM ERROR] Connection failed: {e}")
                sys.stdout.flush()
                self.is_connected = False
                self.sarvam_ws = None

    async def close(self):
        ws_to_close = None
        async with self._lock:
            if self.sarvam_ws:
                ws_to_close = self.sarvam_ws
                self.sarvam_ws = None
            self.is_connected = False

        if ws_to_close:
            try:
                await asyncio.wait_for(ws_to_close.close(), timeout=1.0)
            except Exception:
                pass

    async def flush(self):
        print("[PERSISTENT SARVAM] Flushing due to barge-in...")
        sys.stdout.flush()
        await self.close()
        self.connect_task = asyncio.create_task(self.connect())

    async def listen_loop(self, twilio_ws: WebSocket, stream_sid: str):
        self.twilio_ws = twilio_ws
        self.current_stream_sid = stream_sid
        while True:
            try:
                if not self.is_connected or not self.sarvam_ws:
                    await asyncio.sleep(0.05)
                    continue
                
                current_ws = self.sarvam_ws
                async for response in current_ws:
                    data = json.loads(response)
                    msg_type = data.get("type")
                    if msg_type == "audio":
                        audio_base64 = data.get("data", {}).get("audio")
                        if audio_base64:
                            if self.latency_tracker:
                                self.latency_tracker.record_first_audio()
                            media_payload = {
                                "event": "media",
                                "streamSid": self.current_stream_sid,
                                "media": {
                                    "payload": audio_base64
                                }
                            }
                            await self.twilio_ws.send_json(media_payload)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[PERSISTENT SARVAM LISTEN LOOP ERROR/CLOSE]: {e}")
                sys.stdout.flush()
                async with self._lock:
                    if self.sarvam_ws == current_ws:
                        self.is_connected = False
                        self.sarvam_ws = None
                await asyncio.sleep(0.1)

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
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", "")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY") or getattr(settings, "DEEPGRAM_API_KEY", "") or "340417419c2f5b635c09b71d83a3b86651c18ff5"
SARVAM_AI_KEY = os.getenv("SARVAM_AI_KEY") or getattr(settings, "SARVAM_AI_KEY", "") or "sk_e4q39fpc_I2KMoKcW5rWAJuJ78tNOyf49"
ELEVENLABS_API_KEY = os.getenv("elevenlabs") or os.getenv("ELEVENLABS_API_KEY") or getattr(settings, "ELEVENLABS_API_KEY", "")

def humanize_text(text: str) -> str:
    if not text:
        return ""
    # Replace commas and periods with "... " to introduce natural pauses
    text = text.replace(",", "... ").replace(".", "... ")
    # Replace any multiple consecutive dots with a single "... "
    text = re.sub(r'\.{3,}', '... ', text)
    # Strip whitespace and multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def add_filler(text: str) -> str:
    import random
    fillers = ["okay...", "so...", "hmm...", "actually..."]
    # 70% chance to add a filler to keep it fresh and not overly predictable
    if random.random() < 0.7:
        filler = random.choice(fillers)
        # Check if the text already starts with one of the fillers to avoid duplicates
        text_lower = text.lower()
        if not any(text_lower.startswith(f) for f in fillers) and not text_lower.startswith("hmm okay"):
            return f"{filler} {text}"
    return text

def map_to_sarvam_speaker(voice_id: str, is_female: bool = True) -> str:
    supported = {
        "aditya", "ritu", "ashutosh", "priya", "neha", "rahul", "pooja", "rohan",
        "simran", "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun",
        "manan", "sumit", "roopa", "kabir", "aayan", "shubh", "advait", "anand",
        "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti", "suhani",
        "mohit", "kavitha", "rehan", "soham", "rupali"
    }
    voice_lower = voice_id.lower() if voice_id else ""
    if voice_lower in supported:
        return voice_lower
        
    mappings = {
        "saranya": "ritu",
        "arvind": "shubh",
        "geeta": "priya",
        "lokesh": "rohan",
        "nisha": "neha",
        "v-neha": "neha",
        "v-aria": "simran",
        "v-arjun": "aditya",
        "v-raj": "rohan",
        "rachel": "ritu",
        "bella": "shreya",
        "jessica": "neha",
        "antoni": "shubh",
        "cgsgspj2msm6clmckdw9": "neha",
        "21m00tcm4tlvdq8ikwam": "ritu",
        "aznzlk1xvdevuebnxmlld": "neha",
        "exavitqu4vr4xnsdxmal": "shreya",
        "erxwobayin019pkysvjv": "shubh"
    }
    if voice_lower in mappings:
        return mappings[voice_lower]

    return "neha" if is_female else "aditya"

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

async def query_gpt4o_dialogue_stream(
    user_text: str,
    conversation_history: List[Dict[str, str]],
    system_prompt: str,
    tenant_id: str,
    lead_id: str,
    db_session_factory,
    cached_openai_tools: list,
    cached_gemini_tools: list,
    latency_tracker: CallTurnLatencyTracker = None
):
    """
    Query Gemini or GPT-4o dialogue agent and stream back response chunks.
    Uses cached tools schemas and eliminates db requests.
    """
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
        sys.stdout.flush()
        rag_context = await search_knowledge_base(user_text, tenant_id)
        
    base_prompt = system_prompt
    rules_text = ""
    if "[CRITICAL CONVERSATIONAL RULES]:" in system_prompt:
        parts = system_prompt.split("\n\n[CRITICAL CONVERSATIONAL RULES]:")
        base_prompt = parts[0]
        rules_text = "\n\n[CRITICAL CONVERSATIONAL RULES]:" + parts[1]

    augmented_system_prompt = base_prompt
    if rag_context:
        augmented_system_prompt += (
            f"\n\n[STRICT TENANT KNOWLEDGE BASE CONTEXT]:\n{rag_context}\n\n"
            f"[CRITICAL MULTI-TENANT BOUNDARY LOCK]:\n"
            f"You represent ONLY this registered tenant company. You MUST answer strictly using facts explicitly present in the above context. "
            f"NEVER mention, recommend, or invent policy prices, plans, or insurance types from other companies or external knowledge. "
            f"If a specific detail or price is NOT present in the context above, state politely that a senior advisor will share full details on a callback."
        )
        
    if rules_text:
        augmented_system_prompt += rules_text

    llm_user_text = user_text
    is_female = "You are a FEMALE agent" in system_prompt
    gender_verb_advice = (
        "ALWAYS use female grammar endings (e.g. 'rahi hoon', 'sakti hoon', 'paungi'). NEVER use male endings (e.g. 'raha', 'sakta', 'paunga')."
        if is_female else
        "ALWAYS use male grammar endings (e.g. 'raha hoon', 'sakta hoon', 'paunga'). NEVER use female endings (e.g. 'rahi', 'sakti', 'paungi')."
    )
    llm_user_text += f"\n\n(Important reminder: Reply in strictly 1-2 short lines maximum. Keep it simple and natural in Hinglish. Never use formatting, bullet points, asterisks, or bold text. {gender_verb_advice})"

    if settings.GEMINI_API_KEY:
        import google.generativeai as genai
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            contents = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [msg["content"]]})
            contents.append({"role": "user", "parts": [llm_user_text]})
            if contents and contents[0]["role"] == "model":
                contents.insert(0, {"role": "user", "parts": ["[Call connected]"]})

            models_to_try = ['models/gemini-2.0-flash', 'models/gemini-flash-latest', 'models/gemini-1.5-flash', 'models/gemini-2.0-flash-lite']
            gemini_success = False
            
            for model_name in models_to_try:
                try:
                    model_kwargs = {
                        "model_name": model_name,
                        "system_instruction": augmented_system_prompt
                    }
                    if cached_gemini_tools:
                        model_kwargs["tools"] = cached_gemini_tools
                        
                    model = genai.GenerativeModel(**model_kwargs)
                    current_contents = list(contents)
                    
                    max_gemini_turns = 3
                    for g_turn in range(max_gemini_turns):
                        response = await asyncio.to_thread(
                            model.generate_content,
                            current_contents,
                            generation_config={"temperature": 0.2},
                            stream=True
                        )
                        
                        is_tool_call = False
                        tool_name = None
                        tool_args = {}
                        
                        iterator = iter(response)
                        while True:
                            chunk = await asyncio.to_thread(next, iterator, None)
                            if chunk is None:
                                break
                            
                            if chunk.candidates and chunk.candidates[0].content.parts:
                                part = chunk.candidates[0].content.parts[0]
                                
                                if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                                    is_tool_call = True
                                    tool_name = part.function_call.name
                                    tool_args = dict(part.function_call.args)
                                    break
                                elif hasattr(part, "text") and part.text:
                                    if latency_tracker:
                                        latency_tracker.record_first_token()
                                    yield part.text
                                    
                        if is_tool_call:
                            print(f"[GEMINI TOOL CALL] Executing tool: {tool_name} with arguments: {tool_args}")
                            sys.stdout.flush()
                            tool_res = await execute_tool(tool_name, tool_args, tenant_id, lead_id, db_session_factory)
                            print(f"[GEMINI TOOL RESULT] Tool {tool_name} returned: {tool_res}")
                            sys.stdout.flush()
                            
                            current_contents.append({
                                "role": "model",
                                "parts": [part]
                            })
                            current_contents.append({
                                "role": "user",
                                "parts": [{
                                    "function_response": {
                                        "name": tool_name,
                                        "response": {"result": tool_res}
                                    }
                                }]
                            })
                            continue
                        else:
                            gemini_success = True
                            break
                    if gemini_success:
                        return
                except Exception as e:
                    print(f"[LLM ERROR] Gemini model {model_name} failed: {str(e)}")
                    sys.stdout.flush()
                    continue
        except Exception as e:
            print(f"[LLM ERROR] Gemini streaming pipeline failed: {str(e)}")
            sys.stdout.flush()
            
    # Fallback to OpenAI streaming
    try:
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    except Exception as init_err:
        print(f"[LLM ERROR] OpenAI client initialization failed: {init_err}")
        sys.stdout.flush()
        yield "I am sorry, I am having trouble connecting right now."
        return

    messages = [{"role": "system", "content": augmented_system_prompt}] + conversation_history
    messages.append({"role": "user", "content": llm_user_text})
    
    max_turns = 3
    for turn in range(max_turns):
        try:
            kwargs = {
                "model": "gpt-4o",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 250,
                "stream": True
            }
            if cached_openai_tools:
                kwargs["tools"] = cached_openai_tools
                kwargs["tool_choice"] = "auto"
                
            response = await client.chat.completions.create(**kwargs)
            
            tool_calls_accumulator = {}
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        if latency_tracker:
                            latency_tracker.record_first_token()
                        yield delta.content
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_accumulator:
                                tool_calls_accumulator[idx] = {
                                    "id": tc.id,
                                    "name": tc.function.name if tc.function and tc.function.name else "",
                                    "arguments": tc.function.arguments if tc.function and tc.function.arguments else ""
                                }
                            else:
                                if tc.id:
                                    tool_calls_accumulator[idx]["id"] = tc.id
                                if tc.function:
                                    if tc.function.name:
                                        tool_calls_accumulator[idx]["name"] += tc.function.name
                                    if tc.function.arguments:
                                        tool_calls_accumulator[idx]["arguments"] += tc.function.arguments
                                        
            if tool_calls_accumulator:
                # Resolve tool calls
                openai_message = {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": []
                }
                for idx, tc in tool_calls_accumulator.items():
                    openai_message["tool_calls"].append({
                        "id": tc["id"],
                        "type": "function",
                        "function": {
                            "name": tc["name"],
                            "arguments": tc["arguments"]
                        }
                    })
                messages.append(openai_message)
                
                for idx, tc in tool_calls_accumulator.items():
                    name = tc["name"]
                    args = json.loads(tc["arguments"])
                    print(f"[OPENAI TOOL CALL] Executing tool: {name} with arguments: {args}")
                    sys.stdout.flush()
                    tool_res = await execute_tool(name, args, tenant_id, lead_id, db_session_factory)
                    print(f"[OPENAI TOOL RESULT] Tool {name} returned: {tool_res}")
                    sys.stdout.flush()
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": name,
                        "content": tool_res
                    })
                continue
            else:
                break
        except Exception as e:
            print(f"[LLM ERROR] GPT-4o streaming call or tool execution failed: {str(e)}")
            sys.stdout.flush()
            yield "I am sorry, I am having trouble connecting right now."
            break

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
        
    # Split the critical rules to ensure they are always placed at the very end of system instruction (recency bias)
    base_prompt = system_prompt
    rules_text = ""
    if "[CRITICAL CONVERSATIONAL RULES]:" in system_prompt:
        parts = system_prompt.split("\n\n[CRITICAL CONVERSATIONAL RULES]:")
        base_prompt = parts[0]
        rules_text = "\n\n[CRITICAL CONVERSATIONAL RULES]:" + parts[1]

    augmented_system_prompt = base_prompt
    if rag_context:
        augmented_system_prompt += (
            f"\n\n[STRICT TENANT KNOWLEDGE BASE CONTEXT]:\n{rag_context}\n\n"
            f"[CRITICAL MULTI-TENANT BOUNDARY LOCK]:\n"
            f"You represent ONLY this registered tenant company. You MUST answer strictly using facts explicitly present in the above context. "
            f"NEVER mention, recommend, or invent policy prices, plans, or insurance types from other companies or external knowledge. "
            f"If a specific detail or price is NOT present in the context above, state politely that a senior advisor will share full details on a callback."
        )
        
    if rules_text:
        augmented_system_prompt += rules_text

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

    # Build dynamically-reminded user query to strictly enforce constraints on both Gemini and OpenAI
    llm_user_text = user_text
    is_female = "You are a FEMALE agent" in system_prompt
    gender_verb_advice = (
        "ALWAYS use female grammar endings (e.g. 'rahi hoon', 'sakti hoon', 'paungi'). NEVER use male endings (e.g. 'raha', 'sakta', 'paunga')."
        if is_female else
        "ALWAYS use male grammar endings (e.g. 'raha hoon', 'sakta hoon', 'paunga'). NEVER use female endings (e.g. 'rahi', 'sakti', 'paungi')."
    )
    llm_user_text += f"\n\n(Important reminder: Reply in strictly 1-2 short lines maximum. Keep it simple and natural in Hinglish. Never use formatting, bullet points, asterisks, or bold text. {gender_verb_advice})"

    if settings.GEMINI_API_KEY:
        import google.generativeai as genai
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Convert messages to Gemini format:
            contents = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [msg["content"]]})
            contents.append({"role": "user", "parts": [llm_user_text]})
            if contents and contents[0]["role"] == "model":
                contents.insert(0, {"role": "user", "parts": ["[Call connected]"]})

            models_to_try = [
                'models/gemini-flash-latest',
                'models/gemini-2.0-flash',
                'models/gemini-2.0-flash-lite'
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
                            generation_config={"temperature": 0.2}
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
    messages.append({"role": "user", "content": llm_user_text})
    
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

def is_valid_name(name: str) -> bool:
    if not name:
        return False
    # Avoid long sentences / multi-word descriptions
    words = name.split()
    if len(words) > 2:
        return False
    # Avoid generic/stop words
    stopwords = {
        "a", "an", "the", "helpful", "professional", "assistant", "advisor", "bot", 
        "representative", "sales", "support", "agent", "virtual", "ai", "speaking", 
        "calling", "sure", "here", "there", "someone", "somebody", "admissions",
        "real", "estate", "healthcare", "finance", "ecommerce", "insurance", "services",
        "language", "rule", "rules", "instruction", "instructions", "guideline", "guidelines",
        "context", "mode", "prompt", "system", "status", "conversational"
    }
    for word in words:
        if word.lower() in stopwords:
            return False
    return True

def is_female_agent(agent_name: str, voice_id: str, system_prompt: str) -> bool:
    female_voice_ids = {
        "21m00Tcm4TlvDq8ikWAM",  # Rachel
        "AZnzlk1XvdvUeBnXmlld",  # Neha
        "EXAVITQu4vr4xnSDxMaL",  # Bella
        "cgSgspJ2msm6clMCkdW9",  # Jessica (default)
        "saranya", "geeta", "nisha", "v-neha", "v-aria",
        "ritu", "priya", "simran", "roopa", "ishita", "shreya",
        "kavya", "pooja", "tanya", "shruti", "suhani", "kavitha", "rupali"
    }
    male_voice_ids = {
        "ErXwobaYiN019PkySvjV",  # Antoni
        "aditya", "arvind", "lokesh", "v-arjun", "v-raj",
        "shubh", "rohan", "advait", "aayan", "ashutosh", "rahul",
        "amit", "dev", "varun", "manan", "sumit", "kabir", "anand",
        "tarun", "sunny", "mani", "gokul", "vijay", "mohit", "rehan", "soham"
    }
    if voice_id in female_voice_ids:
        return True
    if voice_id in male_voice_ids:
        return False

    # Try fetching from ElevenLabs voices dynamically to see if gender label is specified
    try:
        from app.routes.tenant_routes import fetch_elevenlabs_voices
        voices_list = fetch_elevenlabs_voices()
        for v in voices_list:
            if v.get("voice_id") == voice_id:
                v_gender = v.get("gender", "").lower()
                if "female" in v_gender:
                    return True
                elif "male" in v_gender:
                    return False
    except Exception as e:
        print(f"[VOICE ORCHESTRATOR] Error fetching ElevenLabs voice gender: {e}")
        
    female_names = {"neha", "rachel", "bella", "jessica", "saranya", "geeta", "nisha", "priya", "pooja", "sneha", "ananya", "aditi", "riya", "ritu", "simran", "roopa", "ishita", "shreya", "kavya", "tanya", "shruti", "suhani", "kavitha", "rupali"}
    male_names = {"antoni", "aditya", "arvind", "lokesh", "rohan", "suresh", "amit", "rahul", "vikram", "shubh", "advait", "aayan", "ashutosh", "dev", "varun", "manan", "sumit", "kabir", "anand", "tarun", "sunny", "mani", "gokul", "vijay", "mohit", "rehan", "soham"}
    
    if agent_name.lower() in female_names:
        return True
    if agent_name.lower() in male_names:
        return False

    prompt_lower = system_prompt.lower() if system_prompt else ""
    if any(kw in prompt_lower for kw in ["female", "she", "her", "kar rahi", "bol rahi"]):
        return True
    if any(kw in prompt_lower for kw in ["male", "he", "him", "kar raha", "bol raha"]):
        return False

    # Default fallback to female
    return True

def extract_agent_name(system_prompt: str) -> str:
    if not system_prompt:
        return "AI"
        
    prompt = system_prompt.strip()
    
    # 1. Check for brackets, e.g. "I am [suresh]", "You are [Neha]", "Your name is [Rohan]"
    bracket_match = re.search(r'(?:I am|You are|Your name is|myself|this is|my name is)\s+\[([A-Za-z0-9_ -]+)\]', prompt, re.IGNORECASE)
    if bracket_match:
        name = bracket_match.group(1).strip()
        if is_valid_name(name):
            return name.title()

    # 2. Look for "I am <Name> from" or "this is <Name> from" (case-insensitive)
    from_match = re.search(r'(?:I am|this is|myself is|here is)\s+([A-Za-z0-9_ -]+?)\s+(?:from|representing|calling|with)', prompt, re.IGNORECASE)
    if from_match:
        name = from_match.group(1).strip()
        if is_valid_name(name):
            return name.title()

    # 3. Look for "You are <Name>," or "You are <Name>." (usually followed by comma/period)
    you_are_match = re.search(r'You are\s+([A-Za-z0-9_ -]+?)[,.]', prompt, re.IGNORECASE)
    if you_are_match:
        name = you_are_match.group(1).strip()
        if is_valid_name(name):
            return name.title()

    # 4. Look for "Your name is <Name>." or "Your name is <Name>," or "My name is <Name>"
    your_name_match = re.search(r'(?:Your name is|My name is)\s+([A-Za-z0-9_ -]+?)[,.]', prompt, re.IGNORECASE)
    if your_name_match:
        name = your_name_match.group(1).strip()
        if is_valid_name(name):
            return name.title()

    # 5. Look for "I am <Name>." or "I am <Name>," (end of sentence or clause)
    i_am_match = re.search(r'I am\s+([A-Za-z0-9_ -]+?)[,.]', prompt, re.IGNORECASE)
    if i_am_match:
        name = i_am_match.group(1).strip()
        if is_valid_name(name):
            return name.title()

    # 6. Check if there's any valid name inside brackets like "[suresh]" or "[Suresh]" anywhere in the prompt
    for bracket_any in re.finditer(r'\[([A-Za-z0-9_ -]+)\]', prompt):
        name = bracket_any.group(1).strip()
        # Ensure it's not a generic placeholder
        if name.lower() not in ["user name", "company name", "phone", "email", "lead name", "date", "time"] and is_valid_name(name):
            return name.title()

    # Fallback checks (existing behavior)
    if "Rohan" in system_prompt:
        return "Rohan"
    elif "Neha" in system_prompt:
        return "Neha"
        
    return "AI"

async def handle_media_stream(twilio_ws: WebSocket, db_session_factory):
    """
    Main orchestrator handling Twilio audio stream WebSocket connections.
    """
    stream_sid = None
    call_sid = None
    campaign_id = None
    lead_id = None
    tenant_id = None
    selected_language = "english"
    
    elevenlabs_key = os.getenv("elevenlabs") or os.getenv("ELEVENLABS_API_KEY") or getattr(settings, "ELEVENLABS_API_KEY", "")
    sarvam_key = os.getenv("SARVAM_AI_KEY") or getattr(settings, "SARVAM_AI_KEY", "") or "sk_e4q39fpc_I2KMoKcW5rWAJuJ78tNOyf49"
    
    conversation_history = []
    active_tts_tasks = []
    
    # 1. Wait for Twilio handshake connection START event
    try:
        while True:
            message = await twilio_ws.receive_text()
            packet = json.loads(message)
            event_type = packet.get("event")
            
            if event_type == "start":
                stream_sid = packet["streamSid"]
                call_sid = packet["start"].get("callSid")
                custom_params = packet["start"].get("customParameters", {})
                campaign_id = custom_params.get("campaign_id")
                lead_id = custom_params.get("lead_id")
                selected_language = custom_params.get("language", "english")
                print(f"[TELEPHONY] Call started. StreamSid={stream_sid}, CallSid={call_sid}, campaign={campaign_id}, lead={lead_id}, language={selected_language}")
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
            try:
                uuid.UUID(str(campaign_id))
                campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            except Exception:
                campaign = None
            
        lead = None
        if lead_id:
            try:
                uuid.UUID(str(lead_id))
                lead = db.query(Lead).filter(Lead.id == lead_id).first()
            except Exception:
                lead = None

        if not lead:
            print("[TELEPHONY ERROR] Lead not found in DB.")
            return
            
        tenant_id = campaign.tenant_id if campaign else lead.tenant_id
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        # Load system prompts & voices
        db_prompt = db.query(PromptVersion).filter(
            PromptVersion.tenant_id == tenant_id,
            PromptVersion.is_active == True
        ).first()
        system_prompt = db_prompt.prompt_text if db_prompt else (tenant.system_prompt if tenant else "You are Neha, an admissions advisor at CoderVu.")
        
        # Load active tools once here and cache them for the call duration (reducing Neon DB overhead)
        active_tools = db.query(ToolSchema).filter(
            ToolSchema.tenant_id == tenant_id,
            ToolSchema.is_active == True
        ).all()
        
        cached_openai_tools = []
        for tool in active_tools:
            cached_openai_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.json_schema
                }
            })

        cached_gemini_tools = []
        for tool in active_tools:
            cached_gemini_tools.append({
                "function_declarations": [
                    {
                        "name": tool.name,
                        "description": tool.description or "",
                        "parameters": convert_schema_to_gemini(tool.json_schema)
                    }
                ]
            })
            
        # Resolve language: check tenant settings first, otherwise fallback to Twilio parameter
        if tenant and tenant.settings and "default_language" in tenant.settings:
            selected_language = tenant.settings["default_language"]
            
        industry_type = tenant.industry if (tenant and tenant.industry) else "Insurance"
        voice_speed = tenant.voice_speed if (tenant and tenant.voice_speed and tenant.voice_speed > 0) else 1.25
        tts_provider = tenant.settings.get("tts_provider", "SARVAM") if (tenant and tenant.settings and isinstance(tenant.settings, dict)) else "SARVAM"
        acknowledgment_enabled = tenant.settings.get("acknowledgment_enabled", False) if (tenant and tenant.settings and isinstance(tenant.settings, dict)) else False
        response_delay_enabled = tenant.settings.get("response_delay_enabled", False) if (tenant and tenant.settings and isinstance(tenant.settings, dict)) else False
    finally:
        db.close()

    # Initialize latency tracker
    latency_tracker = CallTurnLatencyTracker()

    agent_name = extract_agent_name(system_prompt)
    is_female = is_female_agent(agent_name, voice_id, system_prompt)
    
    # If no name was found in system prompt, assign a natural fallback name based on gender
    if agent_name == "AI":
        agent_name = "Neha" if is_female else "Rohan"

    # Establish persistent TTS client if enabled
    tts_client = None
    if tts_provider == "ELEVENLABS" and elevenlabs_key:
        tts_client = PersistentElevenLabsTTS(voice_id, elevenlabs_key, latency_tracker)
        await tts_client.connect()
    elif tts_provider == "SARVAM" and sarvam_key:
        tts_client = PersistentSarvamTTS(voice_id, sarvam_key, latency_tracker, is_female, pace=voice_speed)
        await tts_client.connect()

    # Assemble complete system instruction using centralized prompts module
    from app.prompts import build_full_orchestrator_prompt
    system_prompt = build_full_orchestrator_prompt(
        base_system_prompt=system_prompt,
        selected_language=selected_language,
        agent_name=agent_name,
        is_female=is_female,
        industry=industry_type
    )

    # 3. Establish Deepgram STT websocket client
    dg_url = "wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&endpointing=300"
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
            sys.stdout.flush()

            # Start persistent ElevenLabs WebSocket listen loop if active
            tts_listener_task = None
            if tts_client and tts_client.is_connected:
                tts_listener_task = asyncio.create_task(tts_client.listen_loop(twilio_ws, stream_sid))

            # Small 200ms pause for Twilio audio stream jitter buffer stabilization
            await asyncio.sleep(0.2)

            # Trigger dynamic welcome greeting based on prompt persona and chosen language
            user_name = lead.name if lead else "there"
            company_name = tenant.company_name if (tenant and tenant.company_name) else "SecureLife Insurance"

            if selected_language == "auto" or selected_language == "hindi":
                if is_female:
                    greeting = f"Hello, namaste! Kya main {user_name} se baat kar rahi hoon? Main {agent_name} bol rahi hoon, {company_name} se. Main aapko disturb toh nahi kar rahi? 30 seconds ka time milega?"
                else:
                    greeting = f"Hello, namaste! Kya main {user_name} se baat kar raha hoon? Main {agent_name} bol raha hoon, {company_name} se. Main aapko disturb toh nahi kar raha? 30 seconds ka time milega?"
            else:
                greeting = f"Hello! Am I speaking with {user_name}? I am {agent_name} from {company_name}. Hope I am not disturbing you. Do you have 30 seconds?"
                
            print(f"[TELEPHONY] Sending initial greeting: {greeting}")
            tts_task = asyncio.create_task(render_tts_and_send_to_twilio(greeting, voice_id, twilio_ws, stream_sid, tts_provider))
            active_tts_tasks.append(tts_task)
                
            conversation_history.append({"role": "assistant", "content": greeting})
            
            # Helper: Forward Twilio Inbound call audio to Deepgram
            async def forward_audio_to_deepgram():
                try:
                    while True:
                        message = await twilio_ws.receive_text()
                        packet = json.loads(message)
                        if packet.get("event") == "media":
                            payload = packet["media"]["payload"]
                            raw_audio = base64.b64decode(payload)
                            await dg_ws.send(raw_audio)
                        elif packet.get("event") == "dtmf":
                            digit = packet.get("dtmf", {}).get("digit")
                            print(f"[TELEPHONY DTMF] Received keypress digit from user: '{digit}'")
                            sys.stdout.flush()
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
                            try:
                                print(f"[STT USER]: {transcript}")
                                
                                # Start latency tracking for this turn
                                latency_tracker.start_turn()
                                
                                # Publish transcript updates to Live UI Websockets
                                publish_sync(f"campaign:{campaign_id}:lead:{lead_id}", {
                                    "speaker": "User",
                                    "text": transcript
                                })
                                
                                # Barge-in interruption handler: Flush Twilio playback buffer immediately
                                if active_tts_tasks or (tts_client and tts_client.is_connected):
                                    print("[BARGE-IN] User interrupted AI. Flushing Twilio audio buffer and canceling tasks.")
                                    clear_cmd = {"event": "clear", "streamSid": stream_sid}
                                    await twilio_ws.send_json(clear_cmd)
                                    if tts_client:
                                        await tts_client.flush()
                                    for task in active_tts_tasks:
                                        if not task.done():
                                            task.cancel()
                                    active_tts_tasks.clear()
                                
                                # 1. Add Response Delay (300-800ms) to simulate human reaction/thinking time
                                if response_delay_enabled:
                                    import random
                                    delay = (random.random() * 500 + 300) / 1000.0
                                    await asyncio.sleep(delay)
                                
                                # 2. STT Acknowledgment Layer: play "hmm okay..." immediately
                                ack_task = None
                                if acknowledgment_enabled:
                                    ack_text = "hmm okay..."
                                    ack_task = asyncio.create_task(
                                        render_tts_and_send_to_twilio(ack_text, voice_id, twilio_ws, stream_sid, tts_provider)
                                    )
                                    active_tts_tasks.append(ack_task)
                                
                                # 3. Query GPT-4o dialogue controller and stream response
                                full_reply = ""
                                if tts_client and tts_client.connect_task and not tts_client.connect_task.done():
                                    try:
                                        print("[TTS] Waiting for persistent client to reconnect...")
                                        sys.stdout.flush()
                                        await asyncio.wait_for(tts_client.connect_task, timeout=1.0)
                                    except Exception as ce:
                                        print(f"[TTS ERROR] Wait for reconnect failed: {ce}")
                                        sys.stdout.flush()

                                async for text_chunk in query_gpt4o_dialogue_stream(
                                    transcript,
                                    conversation_history,
                                    system_prompt,
                                    tenant_id,
                                    lead_id,
                                    db_session_factory,
                                    cached_openai_tools,
                                    cached_gemini_tools,
                                    latency_tracker
                                ):
                                    full_reply += text_chunk
                                    
                                print(f"[LLM AGENT] Raw reply completed: {full_reply}")
                                final_reply = full_reply.replace("**", "").replace("*", "").replace("`", "").strip()
                                print(f"[LLM AGENT] Clean reply: {final_reply}")

                                # Render TTS and send audio to Twilio
                                tts_task = asyncio.create_task(render_tts_and_send_to_twilio(final_reply, voice_id, twilio_ws, stream_sid, tts_provider))
                                active_tts_tasks.append(tts_task)
                                
                                # Save history turn
                                conversation_history.append({"role": "user", "content": transcript})
                                conversation_history.append({"role": "assistant", "content": final_reply})
                                
                                # Publish transcript updates to Live UI
                                publish_sync(f"campaign:{campaign_id}:lead:{lead_id}", {
                                    "speaker": "AI",
                                    "text": final_reply
                                })
                                
                                # 5. Fallback path: If persistent ElevenLabs is not active, dispatch legacy rendering task
                                if not tts_client or not tts_client.is_connected:
                                    tts_task = asyncio.create_task(
                                        render_tts_and_send_to_twilio(
                                            final_reply, 
                                            voice_id, 
                                            twilio_ws, 
                                            stream_sid, 
                                            tts_provider, 
                                            wait_for_task=ack_task
                                        )
                                    )
                                    active_tts_tasks.append(tts_task)
                                    
                                # Check if the AI bot decided to close the call due to off-topic turns
                                is_closure_response = "Lagta hai is samay" in final_reply or "insurance ke baare mein baat" in final_reply
                                if is_closure_response:
                                    print("[VOICE ORCHESTRATOR] Closure response detected. Bidding farewell and hanging up...")
                                    sys.stdout.flush()
                                    # Give it 6.5 seconds to speak the farewell audio before closing the websocket to hang up
                                    await asyncio.sleep(6.5)
                                    await twilio_ws.close()
                                    return
                            except Exception as turn_err:
                                print(f"[STT TURN ERROR] Exception during dialogue turn for transcript '{transcript}': {str(turn_err)}")
                                sys.stdout.flush()
                            
                except Exception as e:
                    print(f"[STT PROCESSOR] Transcript exception: {str(e)}")

            # Execute STT forwarding & transcript loops concurrently
            stt_task = asyncio.create_task(forward_audio_to_deepgram())
            llm_task = asyncio.create_task(process_transcripts())
            
            await asyncio.gather(stt_task, llm_task)
            
    except Exception as e:
        print(f"[TELEPHONY ORCHESTRATOR ERROR] Error in WS media loops: {str(e)}")
    finally:
        if tts_listener_task and not tts_listener_task.done():
            tts_listener_task.cancel()
        if tts_client:
            await tts_client.close()
        # Save Call Logs to database on completion
        await save_telephony_call_log(db_session_factory, tenant_id, campaign_id, lead_id, conversation_history, call_sid)

async def render_sarvam_tts_and_send_to_twilio(text: str, voice_id: str, twilio_ws: WebSocket, stream_sid: str, wait_for_task: asyncio.Task = None):
    """
    Renders text to speech using Sarvam AI REST API,
    and sends Base64 media packets to Twilio call socket.
    """
    import httpx
    
    sarvam_key = os.getenv("SARVAM_AI_KEY") or getattr(settings, "SARVAM_AI_KEY", "") or "sk_e4q39fpc_I2KMoKcW5rWAJuJ78tNOyf49"
    if not sarvam_key:
        raise Exception("SARVAM_AI_KEY is missing from environment.")
        
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": sarvam_key,
        "Content-Type": "application/json"
    }
    
    has_hindi = any('\u0900' <= char <= '\u097f' for char in text)
    lang_code = "hi-IN" if has_hindi else "en-IN"
    
    # Map selected voice_id to a valid Sarvam speaker (or default to aditya)
    speaker = map_to_sarvam_speaker(voice_id, is_female=True)
    print(f"[SARVAM AI] Rendering TTS: speaker={speaker}, language={lang_code}, text={text[:50]}...")

    payload = {
        "text": text,
        "speaker": speaker,
        "model": "bulbul:v3",
        "target_language_code": lang_code,
        "speech_sample_rate": 8000,
        "output_audio_codec": "mulaw",
        "pace": 1.25
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                audios = data.get("audios", [])
                if audios:
                    audio_base64 = audios[0]
                    
                    if wait_for_task:
                        try:
                            await wait_for_task
                        except Exception as e:
                            print(f"[SARVAM TTS] Preceding task wait failed: {e}")
                            
                    raw_audio = base64.b64decode(audio_base64)
                    # Strip 44-byte WAV RIFF header if present so Twilio receives pure mu-law audio
                    if raw_audio.startswith(b"RIFF"):
                        raw_audio = raw_audio[44:]

                    chunk_size = 1280  # 160ms of 8000 Hz mu-law audio
                    for i in range(0, len(raw_audio), chunk_size):
                        chunk = raw_audio[i:i + chunk_size]
                        chunk_b64 = base64.b64encode(chunk).decode("utf-8")
                        media_payload = {
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {
                                "payload": chunk_b64
                            }
                        }
                        await twilio_ws.send_json(media_payload)
                        await asyncio.sleep(0.02)  # Paced frame streaming for real-time delivery
                else:
                    raise Exception("Sarvam API returned empty audios array.")
            else:
                raise Exception(f"API returned status {response.status_code}: {response.text}")
    except asyncio.CancelledError:
        print("[TTS CANCELLED] Sarvam rendering task cancelled due to barge-in.")
        raise
    except Exception as e:
        print(f"[SARVAM TTS ERROR] Exception in Sarvam rendering: {str(e)}")
        raise e

async def render_tts_and_send_to_twilio(text: str, voice_id: str, twilio_ws: WebSocket, stream_sid: str, tts_provider: str = "ELEVENLABS", wait_for_task: asyncio.Task = None):
    """
    Pipes text segments to ElevenLabs or Sarvam AI, reads returned Mu-law audio, 
    and sends Base64 media packets to Twilio call socket. Supports automatic provider fallback.
    """
    elevenlabs_key = os.getenv("elevenlabs") or os.getenv("ELEVENLABS_API_KEY") or getattr(settings, "ELEVENLABS_API_KEY", "")
    sarvam_key = os.getenv("SARVAM_AI_KEY") or getattr(settings, "SARVAM_AI_KEY", "") or "sk_e4q39fpc_I2KMoKcW5rWAJuJ78tNOyf49"

    print(f"[TTS CONFIG] active_provider={tts_provider}, selected_voice={voice_id}")

    async def try_elevenlabs(v_id):
        if not elevenlabs_key:
            raise Exception("ElevenLabs API key is missing.")
        import websockets
        effective_voice_id = v_id
        if not v_id or len(v_id) < 15:
            effective_voice_id = "cgSgspJ2msm6clMCkdW9" # Jessica (premade default)
            print(f"[ELEVENLABS] Overriding voice '{v_id}' with default Jessica '{effective_voice_id}'")

        el_url = f"wss://api.elevenlabs.io/v1/text-to-speech/{effective_voice_id}/stream-input?output_format=ulaw_8000"
        el_headers = {"xi-api-key": elevenlabs_key}
        
        async with websockets.connect(el_url, additional_headers=el_headers) as el_ws:
            await el_ws.send(json.dumps({
                "text": " ",
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.4, "similarity_boost": 0.6, "speed": 1.2},
                "xi_api_key": elevenlabs_key
            }))
            await el_ws.send(json.dumps({
                "text": f"{text} ",
                "try_trigger_generation": True
            }))
            await el_ws.send(json.dumps({
                "text": ""
            }))
            
            has_awaited = False
            while True:
                response = await el_ws.recv()
                data = json.loads(response)
                audio_base64 = data.get("audio")
                if audio_base64:
                    if wait_for_task and not has_awaited:
                        try:
                            await wait_for_task
                        except Exception as e:
                            print(f"[TTS] Preceding task wait failed: {e}")
                        has_awaited = True
                        
                    media_payload = {
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {
                            "payload": audio_base64
                        }
                    }
                    await twilio_ws.send_json(media_payload)
                if data.get("isFinal", False):
                    break

    # Determine primary rendering provider
    use_sarvam = (tts_provider == "SARVAM" or (not elevenlabs_key and sarvam_key)) and sarvam_key

    try:
        if use_sarvam:
            print("[TTS] Primary attempt: Sarvam AI...")
            await render_sarvam_tts_and_send_to_twilio(text, voice_id, twilio_ws, stream_sid, wait_for_task)
        else:
            print("[TTS] Primary attempt: ElevenLabs...")
            await try_elevenlabs(voice_id)
    except asyncio.CancelledError:
        print("[TTS CANCELLED] Render task cancelled due to barge-in.")
        raise
    except Exception as primary_err:
        print(f"[TTS PRIMARY ERROR] {str(primary_err)}")
        # Initiate automated provider fallback
        try:
            if use_sarvam:
                fallback_voice = "cgSgspJ2msm6clMCkdW9" # Jessica (premade default)
                print(f"[TTS FALLBACK] Falling back to ElevenLabs with voice={fallback_voice}...")
                await try_elevenlabs(fallback_voice)
            else:
                fallback_voice = "ritu"
                print(f"[TTS FALLBACK] Falling back to Sarvam AI with speaker={fallback_voice}...")
                await render_sarvam_tts_and_send_to_twilio(text, fallback_voice, twilio_ws, stream_sid, wait_for_task)
        except asyncio.CancelledError:
            raise
        except Exception as fallback_err:
            print(f"[TTS CRITICAL ERROR] Both primary and fallback TTS pipelines failed. Primary error: {primary_err}. Fallback error: {fallback_err}")

async def save_telephony_call_log(
    db_session_factory,
    tenant_id: str,
    campaign_id: str,
    lead_id: str,
    conversation_history: List[Dict[str, str]],
    call_sid: str = None
):
    """
    Create a call log with the final dialog history summary.
    """
    db = db_session_factory()
    try:
        from app.models.lead import Lead, LeadStatus
        from app.models.campaign import Campaign
        from app.utils.pubsub import publish_sync
        
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        
        if not conversation_history:
            if lead and lead.status == LeadStatus.CONNECTED:
                # Reset lead status if stuck in Connected
                if campaign_id and campaign_id != "single-call":
                    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if campaign and lead.retry_count < campaign.max_retries:
                        lead.retry_count += 1
                        lead.status = LeadStatus.PENDING_QUEUE
                    else:
                        lead.status = LeadStatus.NOT_INTERESTED
                else:
                    lead.status = LeadStatus.NEEDS_FOLLOW_UP
                
                lead.call_disposition = "No Answer"
                db.commit()
                
                # Publish status update
                pub_campaign_id = "single-call" if campaign_id == "single-call" else campaign_id
                publish_sync(f"campaign:{pub_campaign_id}", {
                    "event": "status_update",
                    "lead_id": str(lead_id),
                    "status": lead.status,
                    "disposition": "No Answer"
                })
                print(f"[TELEPHONY] Stuck lead status reset to {lead.status} for lead {lead_id}")
            return
        # Convert list of role/content items to dialog format list
        transcript_data = [
            {"speaker": "User" if turn["role"] == "user" else "AI", "text": turn["content"]}
            for turn in conversation_history
        ]
        
        # Combine user utterances to search for intent keywords
        user_utterances = [turn["content"].lower() for turn in conversation_history if turn["role"] == "user"]
        user_text_combined = " ".join(user_utterances)

        is_not_interested = any(
            kw in user_text_combined
            for kw in [
                "not interested", "no interest", "intrested nahi", "interest nahi", "intrest nahi",
                "call mat karna", "call mat karo", "call mat kiye", "ab call mat", "ab call nahi",
                "ab call mat karo", "nahi chahiye", "rehne do", "no thanks", "no thank you", "wrong number",
                "don't call", "dont call"
            ]
        )
        
        is_call_later = any(
            kw in user_text_combined
            for kw in [
                "call back later", "call me later", "busy now", "busy right now", "talk later",
                "baat me call", "baad me call", "baad mei call", "busy hoon", "meeting me",
                "meeting mein", "kal call", "parso call", "doosre time", "dusre time", "phir kabhi",
                "bad me", "baat me", "driving"
            ]
        )

        is_converted = any(
            "visit" in turn["content"].lower() or "demo" in turn["content"].lower() 
            for turn in conversation_history
        )

        # Classify the final lead status, intent tag, and call summary
        if is_not_interested:
            final_status = LeadStatus.NOT_INTERESTED
            intent_tag = "Not Interested"
            summary = "Prospect requested to opt-out or was not interested."
        elif is_call_later:
            final_status = LeadStatus.NEEDS_FOLLOW_UP
            intent_tag = "Call Later"
            summary = "Prospect requested to be called back later or was busy."
        elif is_converted:
            final_status = LeadStatus.CONVERTED
            intent_tag = "Warm Lead"
            summary = "Admissions call completed. Booked site visit/demo."
        else:
            final_status = LeadStatus.NEEDS_FOLLOW_UP
            intent_tag = "Cold Call"
            summary = "Qualified admissions inquiry."
            
        # Fetch tenant Twilio settings to query Twilio recording
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        effective_sid = tenant.twilio_account_sid if tenant else None
        effective_token = tenant.twilio_auth_token if tenant else None
        
        if not effective_sid:
            from app.config.settings import settings
            effective_sid = settings.TWILIO_ACCOUNT_SID
            effective_token = settings.TWILIO_AUTH_TOKEN

        recording_url = f"https://s3.amazonaws.com/ai-bot-recordings/call_{lead_id}.mp3" # default fallback
        
        if call_sid and effective_sid and effective_token:
            try:
                # Query Twilio for the recording of this Call SID
                # Give it a small sleep of 1.5 seconds so Twilio completes recording transition
                import time
                time.sleep(1.5)
                from twilio.rest import Client
                twilio_client = Client(effective_sid, effective_token)
                recordings = twilio_client.recordings.list(call_sid=call_sid)
                if recordings:
                    rec = recordings[0]
                    recording_url = f"https://api.twilio.com/2010-04-01/Accounts/{effective_sid}/Recordings/{rec.sid}.mp3"
                    print(f"[TELEPHONY] Found Twilio recording: {recording_url}")
            except Exception as e:
                print(f"[TELEPHONY ERROR] Failed to fetch Twilio recording: {str(e)}")

        db_log = CallLog(
            tenant_id=tenant_id,
            lead_id=lead_id,
            campaign_id=None if campaign_id == "single-call" else campaign_id,
            call_duration=len(conversation_history) * 6, # approximate duration
            call_disposition="Answered",
            recording_url=recording_url,
            ai_summary=summary,
            intent_tag=intent_tag,
            transcript=transcript_data
        )
        
        # Update Lead Status in Database
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            lead.status = final_status
            lead.call_disposition = "Answered"
            
        db.add(db_log)
        db.commit()
        print(f"[TELEPHONY] Successfully saved CallLog for lead={lead_id} to database.")

        # Publish final completed status to campaign WS room so frontend updates in real time
        if campaign_id and campaign_id != "single-call" and lead:
            print(f"[TELEPHONY] Publishing status update to frontend for lead={lead_id}: status={final_status}")
            publish_sync(f"campaign:{campaign_id}", {
                "event": "status_update",
                "lead_id": str(lead_id),
                "status": final_status,
                "disposition": "Answered"
            })
            
    except Exception as e:
        db.rollback()
        print(f"[TELEPHONY] Failed to save CallLog: {str(e)}")
    finally:
        db.close()
