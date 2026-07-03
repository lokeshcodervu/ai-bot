# CoderVu SalesAI — Security & Compliance

**Version:** 1.0

---

## 1. Security Principles

| Principle | Implementation |
|-----------|----------------|
| Defense in depth | Network + app + data layer controls |
| Least privilege | RBAC per role |
| Tenant isolation | Mandatory `tenant_id` scoping |
| Secrets hygiene | No keys in Git; centralized secret store |
| Auditability | Immutable logs for sensitive actions |

---

## 2. Authentication & Session Security

| Control | Requirement |
|---------|-------------|
| Password storage | bcrypt/argon2 *recommended* |
| JWT expiry | Short-lived access token |
| HTTPS | TLS 1.2+ everywhere |
| CORS | Allowlist frontend origins only |
| Rate limiting | Login and public endpoints *recommended* |

---

## 3. Multi-Tenant Data Protection

| Layer | Control |
|-------|---------|
| API | Middleware rejects missing `tenant_id` context |
| ORM | Global filter on tenant-scoped models |
| Pinecone | Namespace = `tenant_id` |
| S3 | Key prefix `tenants/{tenant_id}/` *recommended* |
| Logs | Never log full PAN/PII; mask phone numbers in app logs *recommended* |

### 3.1 Penetration Test Targets (MVP)

- [ ] Cross-tenant lead access via ID tampering  
- [ ] JWT role escalation  
- [ ] Unauthenticated webhook calls  

---

## 4. Telephony Compliance

### 4.1 DND (Do Not Disturb)

| Requirement | Source |
|-------------|--------|
| Pre-dial registry check | AI-Voice PDF |
| Skip and log DND hits | Functional requirement |
| Registry source | *Assumption:* country-specific integration TBD |

### 4.2 Recording Consent

| Requirement | Behavior |
|-------------|----------|
| Announce recording at call start | Automated message before AI dialog |
| Jurisdiction variants | *Recommended:* configurable script per tenant region |

### 4.3 Opt-Out Handling

| Trigger phrase example | Action |
|------------------------|--------|
| "Take me off your list" | End call immediately |
| | Add number to tenant blacklist |
| | Never dial again in any campaign |

---

## 5. AI Safety & Content

| Risk | Mitigation |
|------|------------|
| Hallucinated pricing | RAG + prompt guardrails + escalation script |
| Prompt injection | System prompt boundaries; tool allowlists |
| Abusive callers | De-escalation, terminate, Spam/Abusive tag |
| PII leakage in summaries | Summarization prompt to redact sensitive data *recommended* |

---

## 6. Payment & Billing Compliance

| Topic | Approach |
|-------|----------|
| Stripe | PCI handled by Stripe Elements/hosted checkout |
| Razorpay | GST-compliant domestic flows per PDF |
| Usage transparency | Tenant-visible usage dashboard |
| Auto-suspend | Prevent usage debt at $0 wallet |

---

## 7. Audit & Retention

### 7.1 Audited Events (From Source)

| Event | Fields Logged |
|-------|---------------|
| Lead export | user_id, tenant_id, timestamp, row count |
| AI prompt edit | before/after hash, user_id |
| Data deletion | entity type, id, user_id |

### 7.2 Retention *recommended*

| Data Type | Retention |
|-----------|-----------|
| Call recordings | Configurable per tenant; default 90 days |
| Transcripts | Same as recordings |
| Audit logs | 1 year minimum |
| Billing records | Per tax law (7+ years India *assumption*) |

---

## 8. Infrastructure Security

| Control | Detail |
|---------|--------|
| IAM | Least privilege for ECS tasks |
| Network | Private subnets for DB/Redis |
| Encryption | RDS/S3 encryption at rest |
| Backups | Automated RDS snapshots *recommended* |
| Vulnerability scanning | Container image scan in CI *recommended* |

---

## 9. Incident Response *recommended*

| Severity | Example | Response |
|----------|---------|----------|
| S1 | Cross-tenant data exposure | Disable API, notify tenants |
| S2 | Voice pipeline down | Failover STT, status page |
| S3 | Single tenant billing bug | Patch + credit |

---

## 10. Compliance Checklist (Launch)

- [ ] DND engine active in production dialer  
- [ ] Consent script on all outbound calls  
- [ ] Opt-out blacklist enforced  
- [ ] Audit log for prompt changes  
- [ ] Secrets in secure store, rotated  
- [ ] RBAC verified by QA matrix  
- [ ] Webhook signatures enforced  
- [ ] Privacy policy & terms published *recommended*  

---

*End of document*
