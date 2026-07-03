# CoderVu SalesAI — Complete Requirements Document (BRD/PRD)

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Approved for MVP implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Objectives](#2-vision--objectives)
3. [Stakeholders & Personas](#3-stakeholders--personas)
4. [Scope](#4-scope)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Constraints & Assumptions](#7-constraints--assumptions)
8. [Success Metrics](#8-success-metrics)
9. [Phased Roadmap](#9-phased-roadmap)
10. [Platform Technology Summary](#10-platform-technology-summary)
11. [Dependencies & Integrations](#11-dependencies--integrations)

---

## 1. Executive Summary

**CoderVu SalesAI** is a multi-tenant B2B SaaS platform that automates outbound (and inbound) sales calls using AI voice agents. The system combines real-time speech (STT/TTS), large language model reasoning, retrieval-augmented knowledge (RAG), CRM workflows, campaign orchestration, and usage-based billing.

The platform targets business owners and sales teams—initially aligned with **IT training / admissions** use cases (CoderVu institute context)—who need to qualify leads, handle objections, book demos, and update CRM status without human dialers for every call.

**MVP target:** Production-ready outbound AI calling with multi-tenant isolation, billing, compliance basics, and analytics within a **12-week** engineering program.

---

## 2. Vision & Objectives

### 2.1 Vision

Enable any B2B organization to deploy a **human-like AI sales representative** that operates 24/7 within configured call windows, grounded in the business's own knowledge base, with full auditability and CRM integration.

### 2.2 Business Objectives


| ID   | Objective                                             | Measurement                             |
| ---- | ----------------------------------------------------- | --------------------------------------- |
| BO-1 | Reduce cost per qualified lead vs. human-only dialing | Cost per conversion dashboard           |
| BO-2 | Increase call connection and qualification throughput | Connection rate, conversion rate        |
| BO-3 | Provide actionable post-call intelligence             | AI summaries, intent tags, recordings   |
| BO-4 | Monetize via subscription + usage metering            | Stripe/Razorpay revenue, wallet balance |
| BO-5 | Scale to hundreds of tenants without data leakage     | Zero cross-tenant data incidents        |


### 2.3 Product Objectives (MVP)


| ID   | Objective                                                                       |
| ---- | ------------------------------------------------------------------------------- |
| PO-1 | Sub-second perceived voice latency (< 800ms end-to-end turn)                    |
| PO-2 | Semantic interruption handling (real barge-in, not noise false-positives)       |
| PO-3 | Tenant-scoped RAG (Retrieval-Augmented Generation) for accurate product answers |
| PO-4 | Campaign-driven outbound with smart retry rules                                 |
| PO-5 | Compliance: DND checks, recording consent, opt-out handling                     |


---

## 3. Stakeholders & Personas

### 3.1 Stakeholders


| Stakeholder                       | Interest                                        |
| --------------------------------- | ----------------------------------------------- |
| **CoderVu (Platform Operator)**   | SaaS revenue, platform stability, compliance    |
| **Business Owner (Tenant Admin)** | ROI, billing, AI configuration, team management |
| **Campaign Manager**              | Campaign launch, lead import, live monitoring   |
| **Sales Representative**          | CRM follow-up, call logs, calendar              |
| **End Lead (Customer)**           | Receives AI calls; privacy and opt-out rights   |
| **Engineering / DevOps**          | Deliver MVP on 12-week plan with CI/CD          |
| **Compliance / Legal**            | DND, consent, data retention                    |


### 3.2 Personas


| Persona                      | Goals                                        | Pain Points                        |
| ---------------------------- | -------------------------------------------- | ---------------------------------- |
| **Ravi — Business Owner**    | Launch Q3 bootcamp outreach, control spend   | Manual dialing, inconsistent pitch |
| **Priya — Campaign Manager** | Import CSV, monitor live calls, tune retries | No visibility during calls         |
| **Arjun — Sales Rep**        | Work booked demos from Kanban                | Noise in lead quality              |
| **Neha (AI Persona)**        | Qualify, pitch, book demo                    | N/A (system persona)               |


---

## 4. Scope

### 4.1 In Scope (MVP)


| Area             | Included                                                                              |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Platform**     | Multi-tenant FastAPI + PostgreSQL, JWT auth, RBAC                                     |
| **Frontend**     | Next.js dashboard: auth, CRM Kanban, campaigns, call logs                             |
| **Voice**        | Outbound pipeline: Twilio telephony, Deepgram STT, GPT-4o LLM, ElevenLabs TTS         |
| **Intelligence** | System prompts, RAG (PDF/FAQ upload → Pinecone), function calling to backend          |
| **CRM**          | CSV import, lead pipeline states, AI summaries, S3 recordings                         |
| **Billing**      | Stripe (international) + Razorpay (domestic/GST), usage metering, wallet auto-suspend |
| **Compliance**   | DND pre-dial, consent announcement, opt-out blacklist, audit logs                     |


### 4.2 Out of Scope (V2+)


| Feature                                             | Source                  |
| --------------------------------------------------- | ----------------------- |
| Visual drag-and-drop call flow builder (React Flow) | AI-Voice PDF — deferred |
| Live human agent transfer                           | AI-Voice PDF — deferred |
| Omnichannel (WhatsApp/SMS)                          | AI-Voice PDF — deferred |
| White-label (custom domains/logos)                  | AI-Voice PDF — deferred |


### 4.3 Platform Stack

CoderVu SalesAI is built on **FastAPI + PostgreSQL 16** as the system of record, with tenant-scoped data in PostgreSQL and Pinecone, and external integrations (Twilio, billing, storage) via documented APIs and webhooks.

---

## 5. Functional Requirements

### 5.1 AI Conversational Engine


| ID       | Requirement                    | Priority | Acceptance Criteria                                                                   |
| -------- | ------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| FR-AI-01 | Real-time streaming voice loop | P0       | Audio response begins before full LLM paragraph completes                             |
| FR-AI-02 | End-to-end latency             | P0       | < 800ms perceived turn under normal network                                           |
| FR-AI-03 | Semantic interruption          | P0       | On real user barge-in: flush TTS, cancel in-flight LLM, process new utterance         |
| FR-AI-04 | Function calling               | P0       | LLM emits JSON tools; backend executes (e.g., `book_demo`, `check_seat_availability`) |
| FR-AI-05 | RAG mid-call                   | P0       | Technical questions trigger Pinecone query scoped to `tenant_id`                      |
| FR-AI-06 | Persona & guardrails           | P0       | System prompt enforces persona; no invented pricing; escalation script on unknowns    |
| FR-AI-07 | STT failover                   | P1       | Deepgram failure → OpenAI Whisper (automatic)                                         |
| FR-AI-08 | Silence handling               | P1       | Prompt user twice; end call if still silent                                           |
| FR-AI-09 | Abuse handling                 | P1       | De-escalation, end call, tag lead Spam/Abusive                                        |


### 5.2 Campaign & Lead Orchestration


| ID        | Requirement             | Priority | Acceptance Criteria                                                                         |
| --------- | ----------------------- | -------- | ------------------------------------------------------------------------------------------- |
| FR-CAM-01 | Lead pipeline states    | P0       | Imported → Pending → Ready → Connected → Converted / Follow-up / Not Interested             |
| FR-CAM-02 | Smart retry             | P0       | Configurable: Busy (e.g., 30 min), No Answer (e.g., 4 hr), Switched Off (next business day) |
| FR-CAM-03 | Campaign scoping        | P0       | Per campaign: prompt, call window, max concurrent calls                                     |
| FR-CAM-04 | Celery dialer           | P0       | Worker pulls pending leads from PostgreSQL and initiates Twilio dial                        |
| FR-CAM-05 | Telephony timeout retry | P1       | Failed calls → Celery queue with exponential backoff, max retry limits                      |


### 5.3 CRM & Analytics


| ID        | Requirement          | Priority | Acceptance Criteria                                                    |
| --------- | -------------------- | -------- | ---------------------------------------------------------------------- |
| FR-CRM-01 | Kanban pipeline      | P0       | Visual board; auto-move on disposition                                 |
| FR-CRM-02 | Live call monitoring | P0       | WebSocket/Redis pub-sub updates during active calls                    |
| FR-CRM-03 | Call logs            | P0       | S3 audio + transcript + AI summary per call                            |
| FR-CRM-04 | Analytics dashboards | P1       | Connection rate, AI confidence, objection success, cost per conversion |


### 5.4 Subscription & Billing


| ID        | Requirement            | Priority | Acceptance Criteria                                     |
| --------- | ---------------------- | -------- | ------------------------------------------------------- |
| FR-BIL-01 | Plans                  | P0       | Basic / Pro / Enterprise at signup                      |
| FR-BIL-02 | Usage metering         | P0       | Track telephony minutes, LLM tokens, STT/TTS per tenant |
| FR-BIL-03 | Payment gateways       | P0       | Stripe + Razorpay with webhooks                         |
| FR-BIL-04 | Wallet / auto-recharge | P1       | Suspend campaigns when prepaid balance ≤ 0              |


### 5.5 Compliance & Security


| ID        | Requirement            | Priority | Acceptance Criteria                                            |
| --------- | ---------------------- | -------- | -------------------------------------------------------------- |
| FR-COM-01 | DND engine             | P0       | Pre-dial registry check                                        |
| FR-COM-02 | Consent                | P0       | Recording consent announcement at call start                   |
| FR-COM-03 | Opt-out                | P0       | Phrases like "take me off your list" → terminate + blacklist   |
| FR-COM-04 | Audit logging          | P1       | Immutable logs for exports, prompt edits, deletions            |
| FR-COM-05 | Multi-tenant isolation | P0       | All queries scoped by `tenant_id`; Pinecone namespace = tenant |


### 5.6 Authentication & Administration


| ID         | Requirement                 | Priority | Acceptance Criteria                                      |
| ---------- | --------------------------- | -------- | -------------------------------------------------------- |
| FR-AUTH-01 | JWT authentication          | P0       | Secure API and UI sessions                               |
| FR-AUTH-02 | RBAC                        | P0       | Super Admin, Business Owner, Campaign Manager, Sales Rep |
| FR-AUTH-03 | Business configuration CRUD | P0       | Company profile, timezone, telephony limits              |
| FR-AUTH-04 | User management             | P1       | Owner assigns roles                                      |


---

## 6. Non-Functional Requirements


| ID     | Category        | Requirement                | Target                                          |
| ------ | --------------- | -------------------------- | ----------------------------------------------- |
| NFR-01 | Performance     | Concurrent WebSocket calls | 50+ concurrent (load test Week 12)              |
| NFR-02 | Performance     | Voice turn latency         | < 800ms E2E                                     |
| NFR-03 | Availability    | Rolling deployments        | Zero dropped active calls during deploy         |
| NFR-04 | Scalability     | Tenants                    | Hundreds on shared infra (MVP)                  |
| NFR-05 | Security        | Tenant isolation           | Row-level + middleware enforcement              |
| NFR-06 | Security        | Secrets                    | Centralized `.env`; never in Git                |
| NFR-07 | Reliability     | Retry policy               | Exponential backoff with caps                   |
| NFR-08 | Observability   | Call and API telemetry     | Logs, metrics for pipeline stages               |
| NFR-09 | Maintainability | CI quality gates           | Black/Ruff, Prettier, pytest block deploy       |
| NFR-10 | Compliance      | Data minimization          | Retention policies *recommended* for recordings |


---

## 7. Constraints & Assumptions

### 7.1 Constraints

- **Sequential engineering phases:** Foundation → Auth → Voice → Frontend → RAG → Launch (cannot skip).
- **Third-party API dependency:** Twilio, Deepgram, OpenAI, ElevenLabs, Pinecone availability affects SLA.
- **12-week MVP timeline** per Development Flow PDF.
- **Regulatory:** DND and consent rules vary by country; MVP implements pattern from source docs.

### 7.2 Assumptions


| #   | Assumption                                                                                    |
| --- | --------------------------------------------------------------------------------------------- |
| A1  | Primary markets include India and Vietnam; telephony may require carriers beyond Twilio       |
| A2  | **Super Admin** is the platform operator (CoderVu), distinct from tenant users                |
| A3  | Industry baseline prompts at signup map to prompt templates, not separate codebases           |
| A4  | **JWT** access + refresh token pattern for API and UI sessions                                |
| A5  | **Single region MVP** (e.g., `ap-southeast-1`); multi-region as enterprise upgrade            |
| A6  | **Maximum concurrent calls per tenant** enforced at campaign level                            |
| A7  | External CRM systems may integrate via webhooks/API; CoderVu SalesAI remains system of record |


---

## 8. Success Metrics


| Metric                 | MVP Target                                 | Measurement Source                |
| ---------------------- | ------------------------------------------ | --------------------------------- |
| Call connection rate   | Baseline TBD post-launch                   | Analytics dashboard               |
| AI confidence score    | Track per call                             | Orchestrator + post-call analysis |
| Objection success rate | Track when RAG used                        | CRM + analytics                   |
| Cost per conversion    | Decreasing vs. manual                      | Billing + CRM                     |
| Platform uptime        | 99.5% *recommended*                        | Monitoring                        |
| Onboarding completion  | % tenants launching campaign within 7 days | Product analytics                 |
| p95 voice latency      | < 800ms                                    | Pipeline timestamps               |


---

## 9. Phased Roadmap

### 9.1 MVP (Weeks 1–12) — From Source Docs


| Phase                 | Weeks | Deliverable                                        |
| --------------------- | ----- | -------------------------------------------------- |
| 0 Foundation          | 1–2   | PostgreSQL schema, tenant middleware, Redis/Celery |
| 1 Auth & SaaS         | 3–4   | JWT, RBAC, billing webhooks                        |
| 2 AI Voice Pipeline   | 5–7   | Twilio, WebSocket, STT/LLM/TTS, interruptions      |
| 3 Frontend & CRM      | 8–9   | Next.js, CSV, Kanban, campaigns, call logs         |
| 4 RAG & Intelligence  | 10–11 | Pinecone, embeddings, tool-calling                 |
| 5 Compliance & Launch | 12    | DND, load test, E2E UAT                            |


### 9.2 Post-MVP (V2)

1. React Flow visual call builder
2. Human agent transfer
3. WhatsApp/SMS omnichannel
4. White-label branding
5. Kafka queue upgrade, K8s auto-scale, DB sharding (scale triggers)

---

## 10. Platform Technology Summary


| Component           | Selection                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Voice orchestration | Custom **FastAPI** WebSocket pipeline with **Twilio**, **Deepgram**, **GPT-4o**, **ElevenLabs** |
| Primary database    | **PostgreSQL 16** (tenant-scoped)                                                               |
| Backend framework   | **FastAPI** + Uvicorn + Celery                                                                  |
| LLM                 | **GPT-4o** (Anthropic approved as alternate)                                                    |
| Vector database     | **Pinecone** (namespace per `tenant_id`)                                                        |
| Frontend            | **Next.js 14+**, Tailwind, Zustand, TanStack Query                                              |


---

## 11. Dependencies & Integrations


| Dependency                  | Purpose                            |
| --------------------------- | ---------------------------------- |
| Twilio                      | Telephony, SIP, audio streams      |
| Deepgram Nova-3             | Real-time STT                      |
| OpenAI GPT-4o               | Reasoning, summaries, embeddings   |
| ElevenLabs Turbo v2.5       | TTS                                |
| Pinecone                    | RAG vectors per tenant             |
| Redis                       | Celery broker, pub/sub for live UI |
| AWS S3                      | Recordings, PDF uploads            |
| Stripe / Razorpay           | Payments                           |
| GitHub Actions              | CI/CD                              |
| AWS ECR / ECS or Kubernetes | Deployment                         |


---

## Appendix A — State Machine (Lead Qualification — From Source)

Example conversational states from AI-Voice PDF (CoderVu admissions):

1. Qualify: student vs. professional
2. Pitch relevant module (e.g., Python/React full-stack track)
3. Offer free demo booking

---

## Appendix B — Fault Tolerance Matrix (From Source)


| Scenario                          | System Action                                      |
| --------------------------------- | -------------------------------------------------- |
| STT provider down                 | Failover Deepgram → OpenAI Whisper                 |
| User silent                       | "Hello, are you still there?" × 2 → end call       |
| AI hallucination / low confidence | Specialist escalation script                       |
| Angry/abusive caller              | De-escalate, end, tag Spam/Abusive                 |
| Telephony API timeout             | Mark Failed; Celery retry with exponential backoff |


---

*End of document*