# CoderVu SalesAI — Documentation Index

Professional documentation for the CoderVu SalesAI B2B AI voice sales platform. Source material was derived from product planning documents and consolidated into this folder.

---

## Core Documents

| # | Document | Description |
|---|----------|-------------|
| 01 | [01-Complete-Requirements-Document.md](./01-Complete-Requirements-Document.md) | BRD/PRD: vision, scope, functional & non-functional requirements, roadmap |
| 02 | [02-Tech-Stack-Document.md](./02-Tech-Stack-Document.md) | Technology choices, rationale, connectivity |
| 03 | [03-User-Flow-Document.md](./03-User-Flow-Document.md) | Personas, journeys, edge cases, Mermaid flowcharts |
| 04 | [04-Development-Flow-Document.md](./04-Development-Flow-Document.md) | Phases, CI/CD, testing, deployment, team responsibilities |
| 05 | [05-AI-Training-Document.md](./05-AI-Training-Document.md) | Prompts, RAG, voice AI grounding, evaluation, safety |
| 06 | [06-Functionalities-Document.md](./06-Functionalities-Document.md) | Exhaustive feature catalog with acceptance criteria |

## Supplementary Documents

| # | Document | Description |
|---|----------|-------------|
| 07 | [07-Architecture-Overview.md](./07-Architecture-Overview.md) | System context, components, data flows, deployment topology |
| 08 | [08-API-Integration-Spec-Outline.md](./08-API-Integration-Spec-Outline.md) | Webhooks, tools, external APIs, event contracts |
| 09 | [09-Security-Compliance.md](./09-Security-Compliance.md) | DND, consent, audit, tenancy isolation, billing compliance |
| 10 | [10-Glossary.md](./10-Glossary.md) | Terms and acronyms |

## Word Exports

Microsoft Word (`.docx`) versions are in [word/](./word/). Diagrams are pre-rendered from Mermaid for correct display in Word.

---

## Document Conventions

| Convention | Description |
|------------|-------------|
| **Product name** | **CoderVu SalesAI** — B2B multi-tenant AI voice sales platform |
| **Tenant** | A business customer organization on the SaaS platform |
| **MVP timeline** | 12-week engineering program (6 phases) |
| **Stack** | FastAPI, PostgreSQL 16, Redis, Celery, Next.js, Twilio, Deepgram Nova-3, GPT-4o, ElevenLabs, Pinecone, AWS S3, Stripe/Razorpay |
| **Recommended items** | Marked *recommended* where the source material did not specify a single approach |
| **Deferred (V2)** | Drag-drop flow builder, human transfer, omnichannel, white-label |

---

## Product Naming

| Term | Usage |
|------|--------|
| **CoderVu SalesAI** | Product name for B2B AI voice sales platform |
| **AI Voice Agent Platform** | Generic architecture pattern (reference terminology) |
| **Tenant / Business** | B2B customer organization on the SaaS platform |

---

## Audience

- **Product & BA:** Documents 01, 03, 06, 10  
- **Engineering:** Documents 02, 04, 05, 07, 08  
- **DevOps / SRE:** Documents 04, 07, 09  
- **AI / Prompt Engineering:** Documents 05, 06 (AI engine sections)

---

## Document Status

| Version | Date | Notes |
|---------|------|-------|
| 1.1 | 2026-05-29 | Definitive stack; Word export added |
| 1.0 | 2026-05-29 | Initial release from source extraction |

---

## Folder Layout

```
d:\CoderVu\products\tele-bot\all-docs\
├── documentation/          ← Markdown source
│   └── word/             ← Word (.docx) exports
└── documentation/*.md
```
