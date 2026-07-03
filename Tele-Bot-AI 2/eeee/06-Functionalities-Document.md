# CoderVu SalesAI — Functionalities Catalog

**Version:** 1.0 | Each feature: purpose, actors, I/O, dependencies, acceptance criteria

---

## Table of Contents

1. [Feature Index](#1-feature-index)
2. [Platform & Tenancy](#2-platform--tenancy)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [AI Conversational Engine](#4-ai-conversational-engine)
5. [Campaign & Dialer](#5-campaign--dialer)
6. [CRM & Lead Management](#6-crm--lead-management)
7. [Call Logging & Monitoring](#7-call-logging--monitoring)
8. [Analytics & Reporting](#8-analytics--reporting)
9. [Billing & Subscription](#9-billing--subscription)
10. [Compliance & Security](#10-compliance--security)
11. [Administration](#11-administration)

---

## 1. Feature Index

| ID | Feature | MVP | Source |
|----|---------|-----|--------|
| F-001 | Multi-tenant data isolation | ✅ | All |
| F-002 | JWT authentication | ✅ | All |
| F-003 | RBAC roles | ✅ | Dev + User Journey |
| F-004 | Real-time voice streaming | ✅ | All |
| F-005 | Semantic interruption | ✅ | AI-Voice |
| F-006 | Function calling | ✅ | AI-Voice |
| F-007 | RAG knowledge base | ✅ | All |
| F-008 | CSV lead import | ✅ | All |
| F-009 | Kanban CRM | ✅ | All |
| F-010 | Campaign builder | ✅ | All |
| F-011 | Smart retry logic | ✅ | AI-Voice |
| F-012 | Live call monitoring | ✅ | Tech Stack |
| F-013 | Call recordings & transcripts | ✅ | All |
| F-014 | AI call summaries | ✅ | Tech Stack |
| F-015 | Usage metering | ✅ | AI-Voice |
| F-016 | Stripe/Razorpay billing | ✅ | All |
| F-017 | DND pre-dial | ✅ | AI-Voice |
| F-018 | Consent & opt-out | ✅ | AI-Voice |
| F-019 | Audit logging | ✅ | AI-Voice |
| F-020 | Visual flow builder | V2 | AI-Voice |
| F-021 | Human agent transfer | V2 | AI-Voice |
| F-022 | Omnichannel WhatsApp/SMS | V2 | AI-Voice |

---

## 2. Platform & Tenancy

### F-001: Multi-Tenant Data Isolation

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Serve hundreds of businesses without cross-tenant data leaks |
| **Actors** | All roles; enforced transparently |
| **Inputs** | JWT `tenant_id`, Twilio "To" number (inbound) |
| **Outputs** | Scoped query results only |
| **Dependencies** | PostgreSQL schema, FastAPI middleware, Pinecone namespaces |
| **Acceptance Criteria** | No API returns another tenant's leads; penetration test on ORM bypass |

---

## 3. Authentication & Authorization

### F-002: JWT Authentication

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Secure dashboard and API access |
| **Actors** | All human users |
| **Inputs** | Email/password, OTP at signup |
| **Outputs** | Access token, refresh token *recommended* |
| **Dependencies** | PostgreSQL users table |
| **Acceptance Criteria** | Invalid/expired tokens rejected; logout invalidates session *recommended* |

### F-003: Role-Based Access Control

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Limit sensitive actions by role |
| **Actors** | Super Admin, Business Owner, Campaign Manager, Sales Rep |
| **Inputs** | Role claim in JWT |
| **Outputs** | Filtered UI routes and API 403s |
| **Dependencies** | F-002 |
| **Acceptance Criteria** | Manager cannot access billing APIs; Rep cannot launch campaigns |

---

## 4. AI Conversational Engine

### F-004: Real-Time Voice Streaming Pipeline

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Human-like phone conversations with minimal latency |
| **Actors** | Lead (customer), AI persona, Backend |
| **Inputs** | Twilio audio stream, tenant prompt, lead CRM fields |
| **Outputs** | Synthesized speech, tool calls, transcript |
| **Dependencies** | Twilio, Deepgram, GPT-4o, ElevenLabs, FastAPI WebSocket |
| **Acceptance Criteria** | E2E turn < 800ms p95; audio starts before full LLM completion |

### F-005: Semantic Interruption Handling

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Natural barge-in without noise false triggers |
| **Actors** | Lead, AI |
| **Inputs** | Live audio + partial transcript |
| **Outputs** | Flushed TTS; cancelled LLM; new response |
| **Dependencies** | F-004; semantic turn model *recommended* or orchestrator feature |
| **Acceptance Criteria** | User interrupting "Wait, how much?" stops AI within perceived instant |

### F-006: LLM Function Calling

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Execute business actions during call |
| **Actors** | AI, FastAPI |
| **Inputs** | Tool JSON from LLM |
| **Outputs** | Spoken confirmation; DB updates |
| **Dependencies** | Tool schemas, PostgreSQL |
| **Acceptance Criteria** | `book_demo` creates record; errors spoken gracefully |

### F-007: RAG Knowledge Retrieval

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Accurate answers from tenant documents |
| **Actors** | AI, Campaign Manager (upload), System |
| **Inputs** | PDFs/FAQs, user question transcript |
| **Outputs** | Retrieved chunks in LLM context |
| **Dependencies** | Pinecone, OpenAI embeddings, S3 |
| **Acceptance Criteria** | Fee question answered only from docs; else escalation script |

### F-007a: System Prompt & Persona Configuration

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Define AI behavior per tenant |
| **Actors** | Business Owner |
| **Inputs** | Prompt text, industry template |
| **Outputs** | Versioned prompt stored per tenant |
| **Dependencies** | F-003 (Owner only) |
| **Acceptance Criteria** | Prompt changes audited; affect new calls only |

### F-007b: Voice Selection

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Brand-appropriate voice |
| **Actors** | Business Owner |
| **Inputs** | ElevenLabs voice ID selection |
| **Outputs** | Stored `voice_id` per tenant |
| **Dependencies** | ElevenLabs API |
| **Acceptance Criteria** | Sample playback in UI; used on next call |

### F-007c: STT Failover

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Resilience when Deepgram unavailable |
| **Actors** | System |
| **Inputs** | STT health signal |
| **Outputs** | Whisper transcription |
| **Dependencies** | OpenAI Whisper |
| **Acceptance Criteria** | Automatic switch without call drop *target* |

### F-007d: Silence & Abuse Handlers

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Handle non-cooperative calls |
| **Actors** | System, Lead |
| **Inputs** | VAD/silence duration, sentiment *recommended* |
| **Outputs** | Prompts, end call, lead tags |
| **Dependencies** | F-004 |
| **Acceptance Criteria** | 2 silence prompts then end; abuse tagged Spam/Abusive |

---

## 5. Campaign & Dialer

### F-010: Campaign Builder

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Configure outbound calling programs |
| **Actors** | Campaign Manager, Owner |
| **Inputs** | Name, lead list, prompt override, call window, concurrency, retries |
| **Outputs** | Campaign entity in PostgreSQL |
| **Dependencies** | F-008, F-003, billing active |
| **Acceptance Criteria** | Cannot launch without AI setup + billing gate |

### F-011: Smart Retry Logic

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Recover from busy/no-answer without manual rework |
| **Actors** | Celery worker |
| **Inputs** | Disposition codes, campaign retry policy |
| **Outputs** | Rescheduled dial tasks |
| **Dependencies** | Redis/Celery, Twilio |
| **Acceptance Criteria** | Busy retries in 30 min; no-answer in 4 hr; configurable per campaign |

### F-011a: Outbound Dialer Worker

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Initiate calls for pending leads |
| **Actors** | Celery |
| **Inputs** | Pending queue from PostgreSQL |
| **Outputs** | Twilio dial commands |
| **Dependencies** | F-010, DND engine |
| **Acceptance Criteria** | Respects call window and max concurrency |

### F-011b: Telephony Timeout Retry

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Recover failed API calls |
| **Actors** | Celery |
| **Inputs** | Failed call events |
| **Outputs** | Exponential backoff retries with cap |
| **Dependencies** | F-011 |
| **Acceptance Criteria** | No infinite loops; max retries enforced |

---

## 6. CRM & Lead Management

### F-008: CSV Lead Import

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Bulk load prospects |
| **Actors** | Campaign Manager |
| **Inputs** | CSV: Name, Phone, Email, Notes |
| **Outputs** | Lead records in Pending state |
| **Dependencies** | Column mapping UI |
| **Acceptance Criteria** | Invalid phones rejected; import logged in audit |

### F-009: Kanban Lead Pipeline

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Visual pipeline management |
| **Actors** | Manager, Rep |
| **Inputs** | Lead status updates (manual + automatic) |
| **Outputs** | Board columns |
| **Dependencies** | PostgreSQL lead states |
| **Acceptance Criteria** | Auto-move within 3s of call end *from user journey* |

### F-009a: Lead Pipeline States

| State | Description |
|-------|-------------|
| Imported | Raw from CSV |
| Pending Queue | Awaiting dial |
| Ready To Call | Eligible in window |
| Connected | Active call |
| Converted | Positive outcome |
| Needs Follow-up | Partial interest |
| Not Interested | Closed negative |

---

## 7. Call Logging & Monitoring

### F-012: Live Call Monitoring

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Real-time visibility for managers |
| **Actors** | Campaign Manager |
| **Inputs** | Redis pub/sub events |
| **Outputs** | Live table + optional transcript inspect |
| **Dependencies** | F-004, Redis |
| **Acceptance Criteria** | Status updates during call; Inspect shows scrolling transcript |

### F-013: Call Recordings & Transcripts

| Attribute | Detail |
|-----------|--------|
| **Purpose** | QA and rep review |
| **Actors** | Manager, Rep |
| **Inputs** | Call audio, STT stream |
| **Outputs** | S3 MP3 + full transcript in UI |
| **Dependencies** | S3, PostgreSQL call_logs |
| **Acceptance Criteria** | Playback synced with transcript |

### F-014: AI Call Summary

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Compress call into actionable notes |
| **Actors** | Celery + GPT-4o |
| **Inputs** | End-of-call transcript |
| **Outputs** | Summary text, intent tag |
| **Dependencies** | F-013 |
| **Acceptance Criteria** | Summary available post-call with CRM update |

---

## 8. Analytics & Reporting

### F-014a: Analytics Dashboard

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Measure AI sales performance |
| **Actors** | Owner, Manager |
| **Inputs** | Aggregated call/CRM/billing data |
| **Outputs** | Charts: connection rate, confidence, objection success, cost/conversion |
| **Dependencies** | F-013, F-015 |
| **Acceptance Criteria** | Filters by campaign and date range |

---

## 9. Billing & Subscription

### F-015: Usage-Based Metering

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Bill fairly by consumption |
| **Actors** | System |
| **Inputs** | Telephony minutes, LLM tokens, STT/TTS usage |
| **Outputs** | Usage records per tenant |
| **Dependencies** | Call logs, provider APIs |
| **Acceptance Criteria** | Reconciles with Stripe/Razorpay invoices |

### F-016: Subscription & Payment

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Monetize platform |
| **Actors** | Business Owner |
| **Inputs** | Plan selection, payment method |
| **Outputs** | Active subscription, wallet balance |
| **Dependencies** | Stripe, Razorpay webhooks |
| **Acceptance Criteria** | Webhook activates account; failure blocks launch |

### F-016a: Wallet Auto-Suspend

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Prevent negative balance usage |
| **Actors** | System |
| **Inputs** | Wallet balance |
| **Outputs** | Campaign suspension |
| **Dependencies** | F-016 |
| **Acceptance Criteria** | Campaigns pause at ≤ $0 |

---

## 10. Compliance & Security

### F-017: DND Pre-Dial Check

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Regulatory compliance before dial |
| **Actors** | Celery dialer |
| **Inputs** | Phone number, registry |
| **Outputs** | Skip or allow dial |
| **Dependencies** | DND data source *integration TBD* |
| **Acceptance Criteria** | DND numbers never dialed; reason logged |

### F-018: Recording Consent & Opt-Out

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Legal and ethical calling |
| **Actors** | AI, Lead |
| **Inputs** | Spoken opt-out phrases |
| **Outputs** | Consent played; blacklist on opt-out |
| **Dependencies** | F-004, blacklist store |
| **Acceptance Criteria** | Opt-out ends call immediately; number blacklisted |

### F-019: Audit Logging

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Trace sensitive operations |
| **Actors** | System |
| **Inputs** | Export, prompt edit, delete events |
| **Outputs** | Immutable audit trail |
| **Dependencies** | PostgreSQL audit table *recommended* |
| **Acceptance Criteria** | Admin can query who changed prompt and when |

---

## 11. Administration

### F-003a: User Management

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Team onboarding |
| **Actors** | Business Owner |
| **Inputs** | Email, role assignment |
| **Outputs** | User records |
| **Dependencies** | F-002, F-003 |
| **Acceptance Criteria** | Invited users receive correct RBAC |

### F-003b: Business Configuration

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Tenant profile for calls and UI |
| **Actors** | Owner |
| **Inputs** | Company name, website, timezone, telephony limits |
| **Outputs** | Tenant config record |
| **Dependencies** | F-001 |
| **Acceptance Criteria** | Timezone drives call window evaluation |

### F-003c: Industry Baseline Prompt

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Faster onboarding per vertical |
| **Actors** | System at signup |
| **Inputs** | Industry dropdown selection |
| **Outputs** | Default prompt template |
| **Dependencies** | Prompt template library |
| **Acceptance Criteria** | IT Training vs Real Estate yields different defaults |

---

## V2 Features (Documented, Not MVP)

### F-020: Visual Drag-and-Drop Call Flow Builder

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Non-developer conversation design |
| **Actors** | Owner |
| **Dependencies** | React Flow |
| **Acceptance Criteria** | Deferred post-MVP |

### F-021: Live Human Agent Transfer

| Purpose | Escalate complex calls to human |
| **Acceptance Criteria** | Deferred |

### F-022: Omnichannel (WhatsApp/SMS)

| Purpose | Multi-channel outreach |
| **Acceptance Criteria** | Deferred |

---

*End of document*
