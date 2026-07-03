# CoderVu SalesAI — API & Integration Spec (Outline)

**Version:** 1.0 | **Status:** Outline for implementation — not OpenAPI final

---

## 1. API Conventions

| Convention | Value |
|------------|-------|
| Base URL | `https://api.codervu-salesai.example/v1` *placeholder* |
| Auth | `Authorization: Bearer <JWT>` |
| Tenant scope | From JWT `tenant_id` — never from client body alone |
| Format | JSON |
| Errors | `{ "code", "message", "details" }` |

---

## 2. Authentication Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email, password → OTP sent |
| POST | `/auth/verify-otp` | Activate account |
| POST | `/auth/login` | JWT tokens |
| POST | `/auth/refresh` | Refresh token *recommended* |
| POST | `/auth/logout` | Invalidate session *recommended* |

---

## 3. Tenant & User Management

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/tenant/profile` | Owner+ | Business profile |
| PATCH | `/tenant/profile` | Owner | Update company, timezone |
| GET | `/users` | Owner | List team |
| POST | `/users` | Owner | Invite user with role |
| PATCH | `/users/{id}` | Owner | Change role |
| DELETE | `/users/{id}` | Owner | Remove user |

---

## 4. AI Configuration

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/ai/prompt` | Owner | Current system prompt |
| PUT | `/ai/prompt` | Owner | Update prompt (audit) |
| GET | `/ai/voices` | Owner | List ElevenLabs samples |
| PUT | `/ai/voice` | Owner | Set voice_id |
| POST | `/ai/knowledge/upload` | Owner | Multipart PDF → S3 + ingest job |
| GET | `/ai/knowledge/status` | Owner | Vectorization progress |
| GET | `/ai/tools` | Owner | Registered tool schemas |

---

## 5. Leads & CRM

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/leads` | Manager+ | Paginated list |
| POST | `/leads/import` | Manager+ | CSV upload |
| GET | `/leads/template.csv` | Manager+ | Download template |
| PATCH | `/leads/{id}` | Rep+ | Update status, notes |
| GET | `/leads/board` | Rep+ | Kanban aggregation |

---

## 6. Campaigns

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/campaigns` | Manager+ | List campaigns |
| POST | `/campaigns` | Manager+ | Create |
| PATCH | `/campaigns/{id}` | Manager+ | Update window, retries |
| POST | `/campaigns/{id}/launch` | Manager+ | Start dialer |
| POST | `/campaigns/{id}/pause` | Manager+ | Pause queue |
| GET | `/campaigns/{id}/live` | Manager+ | Live status feed |

---

## 7. Calls

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/calls` | Rep+ | Call history |
| GET | `/calls/{id}` | Rep+ | Transcript, summary, recording URL |
| GET | `/calls/{id}/recording` | Rep+ | Signed S3 URL |

---

## 8. Analytics & Billing

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/analytics/overview` | Manager+ | KPIs |
| GET | `/billing/subscription` | Owner | Plan status |
| POST | `/billing/checkout` | Owner | Stripe/Razorpay session |
| GET | `/billing/usage` | Owner | Metered usage |
| POST | `/billing/webhooks/stripe` | System | Stripe events |
| POST | `/billing/webhooks/razorpay` | System | Razorpay events |

---

## 9. WebSocket Endpoints

| Endpoint | Purpose |
|----------|---------|
| `WS /ws/twilio/media` | Twilio Media Streams ↔ voice pipeline |
| `WS /ws/dashboard/calls` | Live events for UI *or* SSE alternative |

---

## 10. Inbound Webhooks (External → Platform)

| Source | Path | Verification |
|--------|------|--------------|
| Twilio | `/webhooks/twilio/voice` | X-Twilio-Signature |
| Twilio | `/webhooks/twilio/status` | Status callbacks |
| Stripe | `/billing/webhooks/stripe` | Stripe signature |
| Razorpay | `/billing/webhooks/razorpay` | Razorpay signature |
| Vapi/Retell *optional* | `/webhooks/orchestrator/*` | Provider-specific |

---

## 11. LLM Tool Endpoints (Internal)

Called by voice orchestrator during calls:

| Tool | Method | Path | Request | Response |
|------|--------|------|---------|----------|
| `book_demo` | POST | `/tools/book-demo` | `{ date, time, lead_id }` | `{ success, message }` |
| `check_seat_availability` | GET | `/tools/seat-availability` | `course` query | `{ available, seats }` |
| `search_knowledge` | POST | `/tools/search-knowledge` | `{ query }` | `{ chunks[] }` |
| `update_lead_status` | PATCH | `/tools/lead-status` | `{ lead_id, status }` | `{ success }` |
| `blacklist_number` | POST | `/tools/blacklist` | `{ phone, reason }` | `{ success }` |

External systems may consume the same tool contracts via an HTTP adapter layer *recommended*; CoderVu SalesAI remains the system of record on **FastAPI + PostgreSQL**.

---

## 12. Event Schema (Redis Pub/Sub)

| Event | Payload Fields |
|-------|----------------|
| `call.ringing` | `call_id`, `lead_id`, `campaign_id` |
| `call.connected` | + `timestamp` |
| `call.transcript.partial` | `text`, `speaker` |
| `call.intent_detected` | `intent`, `confidence` |
| `call.ended` | `disposition`, `duration` |

---

## 13. Post-Call Async Jobs (Celery)

| Task | Trigger | Output |
|------|---------|--------|
| `summarize_call` | Call end | Summary + intent in PostgreSQL |
| `ingest_document` | PDF upload | Pinecone upsert |
| `retry_failed_call` | Telephony timeout | Rescheduled dial |
| `aggregate_usage` | Call end | Billing usage row |

---

*Full OpenAPI spec to be generated during Phase 3 implementation.*
