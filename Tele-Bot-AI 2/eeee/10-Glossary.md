# CoderVu SalesAI — Glossary

| Term | Definition |
|------|------------|
| **ASR** | Automatic Speech Recognition — converts audio to text (e.g., Deepgram) |
| **Barge-in** | User interrupting the AI while it is speaking |
| **Campaign** | Configured outbound calling program with leads, schedule, and retry rules |
| **CoderVu SalesAI** | B2B SaaS product for AI-powered voice sales |
| **CRM** | Customer Relationship Management — lead pipeline and dispositions |
| **Deepgram Nova-3** | Real-time STT model in the CoderVu SalesAI voice pipeline |
| **Disposition** | Outcome label for a call (e.g., Converted, Not Interested) |
| **DND** | Do Not Disturb — registry of numbers that must not be dialed |
| **E2E latency** | End-to-end time from user stops speaking to AI audio response |
| **ElevenLabs** | TTS provider for human-like voice output |
| **Endpointing** | Detecting when a speaker has finished talking |
| **FastAPI** | Python async web framework for APIs and WebSockets |
| **Function calling** | LLM emitting structured tool invocations (JSON) for backend actions |
| **GPT-4o** | Primary OpenAI LLM for dialog and summarization |
| **Guardrails** | Prompt rules preventing harmful or incorrect AI behavior |
| **Hinglish** | Mix of Hindi and English speech — called out for STT accuracy in PDFs |
| **In-context learning** | Controlling AI via prompts and retrieved context instead of weight fine-tuning |
| **JWT** | JSON Web Token for API authentication |
| **Kanban** | Visual board for lead pipeline states |
| **Lead** | Prospective customer record with phone and metadata |
| **LLM** | Large Language Model — reasoning engine (GPT-4o) |
| **MVP** | Minimum Viable Product — 12-week launch scope |
| **Namespace** | Pinecone isolation unit mapped to `tenant_id` |
| **RAG** | Retrieval-Augmented Generation — inject retrieved docs into LLM context |
| **RBAC** | Role-Based Access Control |
| **Redis Pub/Sub** | Message channel for live UI call updates |
| **Voice pipeline** | Custom FastAPI WebSocket path: Twilio → Deepgram → GPT-4o → ElevenLabs |
| **RLS** | Row-Level Security — PostgreSQL tenant isolation pattern |
| **SaaS** | Software as a Service — multi-tenant subscription product |
| **Semantic turn-taking** | AI-driven detection of real interruptions vs. background noise |
| **STT** | Speech-to-Text — same as ASR |
| **Tenant** | A business customer organization on the platform |
| **TTS** | Text-to-Speech — ElevenLabs |
| **Twilio** | Cloud telephony provider for calls and media streams |
| **Uvicorn** | ASGI server hosting FastAPI |
| **VAD** | Voice Activity Detection — legacy interrupt detection (discouraged per PDF) |
| **Vector DB** | Database storing embeddings for semantic search (Pinecone) |
| **WebSocket** | Persistent bidirectional connection for real-time audio and events |
| **White-label** | Custom branding per tenant (deferred V2) |

---

*End of document*
