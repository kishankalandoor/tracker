# Technical Decisions & Assumptions — TrackOS

---

## Key Technical Decisions

### 1. Express + TypeScript over NestJS or Fastify
**Decision:** Plain Express with TypeScript.  
**Rationale:** MVP speed. NestJS adds significant boilerplate for a project of this scope. Express gives full control with minimal overhead. TypeScript provides type safety without the complexity of a full framework.  
**Trade-off:** No built-in dependency injection, module system, or OpenAPI generation. Acceptable at this scale.

---

### 2. MongoDB over PostgreSQL / Supabase
**Decision:** MongoDB with Mongoose.  
**Rationale:** The core feature — Universal Tracker — requires a **schemaless entry store** where `data` is a flexible key-value map determined at runtime by the user's tracker definition. A relational schema would require EAV tables or JSON columns, adding complexity.  
**Trade-off:** No foreign key constraints; referential integrity enforced at application level. No joins (replaced with multiple queries).  
**Note:** If Supabase/PostgreSQL were required, a JSONB column for `TrackerEntry.data` with GIN indexes would be the equivalent pattern.

---

### 3. OmniRoute as the AI Gateway
**Decision:** All LLM calls go through OmniRoute (`localhost:20128`) instead of directly to providers.  
**Rationale:**
- Single API key to manage
- Automatic load balancing across providers
- Dashboard for monitoring usage/costs
- Swap models without changing application code  

**Trade-off:** Adds a local dependency (OmniRoute must be running). Mitigated by the fallback chain — if OmniRoute fails, all AI features fail together.

---

### 4. 6-Model Fallback Chain
**Decision:** Try 6 models in sequence on 403/429 errors.  
**Rationale:** Free-tier models exhaust quota quickly. Rather than asking users to wait 24 hours, the system silently falls back.  
**Trade-off:** Inconsistent quality — a DeepSeek response for routine generation may be less nuanced than Claude Opus. Acceptable for MVP; not ideal for production where you'd pay for reliable access.

---

### 5. Human-in-the-Loop Approval for AI-Generated Content
**Decision:** AI never auto-saves — always shows a draft for human review and editing before saving.  
**Rationale:** AI output for structured schemas is imperfect. Tracker fields with wrong types or names would corrupt entries. A review step catches errors and builds user trust.  
**Trade-off:** Extra click for the user. Compensated by making the edit interface fast and intuitive.

---

### 6. JWT Authentication (Stateless)
**Decision:** JWT with 30-day expiry stored in localStorage via Zustand.  
**Rationale:** Stateless — no session store needed. Simple to implement. Scales horizontally without sticky sessions.  
**Trade-off:** JWTs cannot be invalidated server-side before expiry (no logout from all devices). Acceptable for MVP. Production fix: maintain a token blocklist in Redis.

---

### 7. Global CSS Variables for Theming
**Decision:** Theme applied via `body[data-theme="light"]` CSS attribute, not a CSS-in-JS library.  
**Rationale:** No runtime JavaScript cost for theme switching. Persists across page navigation. One `localStorage` key controls all pages.  
**Trade-off:** CSS variables require careful naming discipline. Hardcoded hex colors (pre-refactor) would break theming.

---

### 8. Persistent Chat Messages in MongoDB
**Decision:** Every chat message stored in `chatmessages` collection (not in-memory history).  
**Rationale:** Matches user expectation of "never forgets" (like ChatGPT). Messages survive browser refresh, device switch, and server restarts.  
**Trade-off:** Higher write load per chat turn (2 writes: user message + assistant message). Acceptable; no high-concurrency requirement at MVP.

---

### 9. Docker Compose with 3 Services
**Decision:** Single `docker-compose.yml` running MongoDB, API, and Nginx/React together.  
**Rationale:** One command to start everything. Deterministic builds. No "works on my machine" issues.  
**Trade-off:** Not Kubernetes-native. Scaling requires converting to separate services on ECS/EKS. Acceptable for MVP deployment on a single EC2.

---

### 10. Nginx as Frontend Server + API Proxy
**Decision:** React SPA built into static files, served by Nginx, which also proxies `/api/*` to the backend.  
**Rationale:** No CORS issues (same origin). Standard production pattern. Nginx adds caching, gzip, and security headers.  
**Trade-off:** Adding SSR (Next.js) would require replacing this setup.

---

## Key Assumptions

1. **OmniRoute is available** — the application has a hard dependency on an AI gateway. If OmniRoute is down, AI features fail (tracker/routine generation, chat). Core tracker entry logging and routine management still work without AI.

2. **Single user per deployment** — no team/workspace sharing. All data is scoped to `ownerId` (the authenticated user). Multi-tenancy would require workspace abstraction.

3. **No offline support** — the app requires network access for all features. No service workers or local-first architecture.

4. **Tracker entries are append-only** — no edit or delete of individual entries in MVP. The assumption is tracking data is historical and immutable.

5. **Routine tasks are ordered by array index** — no drag-to-reorder in MVP. Order is determined by creation sequence.

6. **AI-generated times assume IST/local timezone** — the AI is told the current local time but timezone conversion is not handled for global deployments.

---

## Limitations

| Area | Limitation | Priority Fix |
|---|---|---|
| AI | No streaming responses (text appears all at once) | Medium |
| AI | Context window capped at 20 messages | Medium |
| Auth | No password reset flow | High |
| Auth | No email verification | High |
| Trackers | No entry editing/deletion | Low |
| Routines | No drag-to-reorder tasks | Low |
| Chat | No file/image upload | Low |
| Database | No automated backups | High (production) |
| API | No rate limiting | High (production) |
| Monitoring | No application performance monitoring | Medium |
| HTTPS | Not configured in Compose (needs ALB or Certbot) | High (production) |

---

## Future Improvements

### Short-term (next sprint)
- Password reset via email (nodemailer + token)
- Rate limiting (`express-rate-limit`)
- AI response streaming (SSE)
- MongoDB Atlas for managed database

### Medium-term
- Team/workspace sharing (shared trackers and routines)
- CSV/JSON export of tracker entries
- Weekly AI-generated summary emails
- Mobile-responsive PWA

### Long-term
- Native mobile apps (React Native)
- Zapier/webhook integrations (trigger on task completion)
- Custom AI agents per tracker type
- Self-hostable OmniRoute alternative for production
