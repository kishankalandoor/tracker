# TrackOS — Planner MVP Submission Document

> **Author**: Kishan Kalandoor  
> **Product**: TrackOS — Universal Planner & Tracker  
> **Stack**: MERN (MongoDB · Express · React + Vite + TypeScript · Node.js)  
> **Submission Date**: September 2026

---

## A. Product Understanding & Vision

TrackOS is a full-stack productivity platform that unifies four experiences in one application:

1. **AI Tracker Generator** — Describe what you want to track, and Gemini AI generates a custom tracker schema. A human-in-the-loop (HITL) approval step lets users edit fields before saving.
2. **Planner with Rich Content Blocks** — Create planners from templates or from scratch. Add Text, Task Lists, Checklists, and Note blocks. Auto-saves every 2 seconds.
3. **Routines with AI Co-pilot** — AI generates daily routines with tasks, time estimates, and notes.
4. **Persistent AI Chatbot** — Gemini-powered chatbot with conversation history stored in MongoDB.

The Planner MVP extends this with:
- A **Template Library** (10 templates, 6 categories, all backend-driven)
- **Calendar View** to visualise planners by date
- **Reminder notifications** via browser Notification API
- **PWA support** for offline shell and "Add to Home Screen"

---

## B. User Experience & Flow

See [USERFLOW.md](./USERFLOW.md) for complete ASCII flow diagrams. Summary:

| Flow | Entry | Exit |
|------|-------|------|
| Register → First Tracker | `/login` | Dashboard with chart |
| Template → Planner → Edit → Reminder → Done | `/templates` | `/planners/:id` |
| AI Chatbot | `/chatbot` | — |
| Routine scheduling | `/routines` | Routine checklist |
| Calendar navigation | `/calendar` | `/planners/:id` |

---

## C. Technical Architecture

```
┌─────────────────────────────────────────────────┐
│             CLIENT (React + Vite + TS)           │
│  Pages: Dashboard, Routines, Chatbot,            │
│         Templates, Planners, PlannerEditor,      │
│         CalendarView                            │
│  Components: Sidebar, ReminderBell              │
│  PWA: manifest.json + sw.js (App Shell)         │
└──────────────────┬──────────────────────────────┘
                   │ Axios (JWT Bearer)
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│          SERVER (Express + TypeScript)           │
│  Routes: /api/auth, /api/trackers,               │
│          /api/ai, /api/routines, /api/chat,      │
│          /api/planners, /api/reminders           │
│  Middleware: JWT auth, asyncHandler, CORS        │
│  AI: Google Gemini 2.0 Flash (via @google/       │
│       generative-ai)                             │
└──────────────────┬──────────────────────────────┘
                   │ Mongoose ODM
┌──────────────────▼──────────────────────────────┐
│              MongoDB Atlas / Local               │
│  Collections: users, trackerdefinitions,         │
│               trackerentries, routines,          │
│               conversations, chatmessages,       │
│               planners, reminders                │
└─────────────────────────────────────────────────┘
```

### Android Deployment — PWA / TWA Approach

> **FDE Rationale**: A separate Native Android/Kotlin codebase is not required when a PWA is submitted as a **Trusted Web Activity (TWA)** — a first-class Play Store distribution method recommended by Google.

**Option A — Progressive Web App (Immediate)**
- Users on Android Chrome can tap "Add to Home Screen"
- The app launches in `display: standalone` mode (no browser chrome)
- Works offline via the App Shell service worker
- Receives push notifications via browser Notification API

**Option B — Play Store via TWA (Production)**
1. Build production bundle: `cd web && npm run build`
2. Use **Bubblewrap CLI**: `npx @bubblewrap/cli init --manifest https://your-domain.com/manifest.json`
3. This generates an Android Studio project wrapping the PWA in a TWA
4. Sign the APK/AAB and submit to Google Play Store
5. Alternatively, use **PWABuilder.com** for a zero-code TWA wrapper

This approach maintains a single codebase while satisfying the Android deployment requirement.

---

## D. Template System

The template system is entirely **backend-driven** — no templates are hard-coded in the frontend.

### Architecture
- Templates are `TrackerDefinition` documents with `isTemplate: true`
- Seeded on first run via `npx ts-node src/seed.ts`
- Frontend fetches via `GET /api/trackers/templates?category=<cat>` (public endpoint, no auth)
- Category filter applied server-side with MongoDB query
- Search filter applied client-side for zero-latency UX

### 10 Built-in Templates

| # | Name | Category | Fields |
|---|------|----------|--------|
| 1 | Daily Planner | Personal | 5 |
| 2 | Weekly Planner | Personal | 8 |
| 3 | Goal Tracker | Personal | 6 |
| 4 | Health & Fitness | Health | 5 |
| 5 | Meal Planner | Health | 6 |
| 6 | Fitness Log | Fitness | 5 |
| 7 | Expense Tracker | Finance | 4 |
| 8 | Study Planner | Study | 6 |
| 9 | Project Planner | Work | 6 |
| 10 | Hackathon Project | Work | 4 |

---

## E. Database Design

### Collection: `users`
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Unique, required |
| `passwordHash` | String | bcryptjs hashed |
| `timestamps` | — | createdAt, updatedAt |

### Collection: `trackerdefinitions`
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `category` | String | enum: Personal/Health/Finance/Work/Study/Fitness |
| `description` | String | — |
| `fields` | Array | fieldKey, label, type, required, options? |
| `isTemplate` | Boolean | true for built-in templates |
| `ownerId` | ObjectId | ref: User |

### Collection: `planners`
| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | ObjectId | ref: User, required |
| `templateId` | ObjectId | ref: TrackerDefinition, optional |
| `title` | String | Required |
| `emoji` | String | Visual identifier |
| `content.blocks` | Array | `{id, type, data}` flexible blocks |
| `reminderAt` | Date | null if not set |
| `reminderNote` | String | Optional note for reminder |
| `isCompleted` | Boolean | default false |
| `lastSavedAt` | Date | Updated on every save |

**Index**: `{ ownerId: 1, updatedAt: -1 }` for efficient user-scoped pagination

### Collection: `reminders`
| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | ObjectId | ref: User, required |
| `plannerId` | ObjectId | ref: Planner, optional |
| `title` | String | Required |
| `reminderAt` | Date | Required |
| `isAcknowledged` | Boolean | default false |

**Index**: `{ ownerId: 1, reminderAt: 1, isAcknowledged: 1 }` for efficient upcoming reminder queries

### Collection: `routines`
| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | ObjectId | ref: User |
| `title` | String | Required |
| `tasks` | Array | taskName, estimatedMinutes, startTime, endTime, isCompleted, aiNotes |

### Collections: `conversations`, `chatmessages`
Linked by `conversationId`, persist full chat history per user.

---

## F. API Design

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Returns JWT |

### Trackers & Templates
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trackers` | ✅ | User's trackers + templates |
| POST | `/api/trackers` | ✅ | Create tracker |
| GET | `/api/trackers/:id/entries` | ✅ | Get entries |
| POST | `/api/trackers/:id/entries` | ✅ | Log entry |
| GET | `/api/trackers/templates` | — | All templates (public) |
| GET | `/api/trackers/templates/:id` | — | Single template |
| POST | `/api/trackers/templates/:id/download` | ✅ | Log download |

### Planners
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/planners` | ✅ | List user's planners |
| POST | `/api/planners` | ✅ | Create (optionally from template) |
| GET | `/api/planners/:id` | ✅ | Get single planner |
| PUT | `/api/planners/:id` | ✅ | Update (PATCH semantics) |
| DELETE | `/api/planners/:id` | ✅ | Delete |

### Reminders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reminders` | ✅ | Upcoming unacknowledged |
| POST | `/api/reminders` | ✅ | Create reminder |
| PUT | `/api/reminders/:id/ack` | ✅ | Acknowledge |

### AI & Chat
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/generate` | ✅ | Generate tracker schema |
| POST | `/api/ai/routine` | ✅ | Generate routine |
| POST | `/api/chat` | ✅ | Chat with AI |
| GET | `/api/chat/history` | ✅ | Load conversation |

### Example: Create Planner from Template
```http
POST /api/planners
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Daily Planner — Sept 9",
  "templateId": "64abc123def456789"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "64xyz",
    "title": "Daily Planner — Sept 9",
    "emoji": "🌅",
    "content": {
      "blocks": [
        { "id": "block-1", "type": "note", "data": { "content": "Plan your day..." } },
        { "id": "block-2", "type": "task", "data": { "tasks": [
          { "text": "Wake Up Time", "isCompleted": false },
          { "text": "Top Priority for Today", "isCompleted": false }
        ]}}
      ]
    },
    "isCompleted": false,
    "lastSavedAt": "2026-09-09T14:20:00Z"
  }
}
```

---

## G. Error Handling Strategy

- All async controllers wrapped with `express-async-handler` — unhandled Promise rejections automatically forwarded to Express error middleware
- Global `errorHandler` middleware in `src/middleware/errorMiddleware.ts` returns consistent `{ success: false, error: { code, message } }` shape
- Frontend Axios errors surfaced via `err.response?.data?.error?.message` fallback chain
- 404 responses for resource not found (always scoped to `ownerId` — prevents cross-user access)
- Input validation at controller level with early 400 responses before any DB operations

---

## H. Performance & Scalability

| Concern | Approach |
|---------|---------|
| Auto-save throttling | 2s debounce — max 1 PUT per 2s per planner |
| Template fetch | Category filter applied server-side; client-side search for zero-latency |
| Reminder polling | Every 60s via `setInterval` in `ReminderBell` — minimal API load |
| MongoDB indexes | `ownerId + updatedAt` on planners; `ownerId + reminderAt` on reminders |
| Service Worker | App Shell caches static assets — 0 network requests for shell on repeat visits |
| Vite build | Tree-shaking + code splitting for fast initial load |

---

## I. Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT (jsonwebtoken) signed with `JWT_SECRET` env var |
| Password hashing | bcryptjs with salt rounds (default 10) |
| Route protection | `protect` middleware validates Bearer token on all write routes |
| Resource scoping | All queries include `ownerId: req.user?._id` — no user can access another's data |
| CORS | Express CORS middleware — restrict to known origins in production |
| Env secrets | `.env` gitignored, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY` |
| Input sanitisation | Mongoose schemas enforce types and `trim: true` |

---

## J. AI Integration

TrackOS integrates **Google Gemini 2.0 Flash** for three features:

### 1. Tracker Generator (Human-in-the-Loop)
```
User prompt → POST /api/ai/generate → Gemini generates JSON schema
             → Frontend shows draft for review/edit
             → User approves → POST /api/trackers
```
The HITL step is enforced — AI output is **never auto-saved**. Users must explicitly approve.

### 2. Routine Generator
```
User describes routine → POST /api/ai/routine → Gemini returns task array
                       → User can edit tasks before saving
                       → POST /api/routines
```

### 3. Conversational AI (Chatbot)
- Full conversation history stored in MongoDB (per-user, persistent across sessions)
- System prompt instructs Gemini to be a TrackOS productivity assistant
- Supports questions about trackers, routines, and planning advice

---

## K. PWA Features

| Feature | Implementation |
|---------|---------------|
| Web App Manifest | `/public/manifest.json` — name, icons, theme, shortcuts |
| Installability | `display: standalone`, `start_url: /` |
| App Shell Caching | `sw.js` caches `/` and `/index.html` on install |
| Offline Fallback | Navigation requests return cached shell when offline |
| API Pass-through | `/api/*` requests always go to network |
| Browser Notifications | `Notification.requestPermission()` + `new Notification()` in `ReminderBell` |
| Theme Color | `<meta name="theme-color" content="#7c3aed">` |
| Apple Touch Icon | `<link rel="apple-touch-icon">` |
| App Shortcuts | manifest.json shortcuts for Planners, Templates, Calendar |

---

## L. Android Deployment — TWA Guide

### Step 1: Build the PWA
```bash
cd web
npm run build
# Serve dist/ folder or deploy to Vercel/Netlify/AWS
```

### Step 2: Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://your-domain.com/manifest.json
```

### Step 3: Build Android APK
```bash
bubblewrap build
# Produces app-release-signed.apk
```

### Step 4: Upload to Play Store
1. Go to Google Play Console → Create app
2. Upload `app-release-signed.aab` (preferred) or `.apk`
3. Add `assetlinks.json` to server for TWA verification:
   ```json
   [{ "relation": ["delegate_permission/common.handle_all_urls"],
      "target": { "namespace": "android_app",
                  "package_name": "com.trackos.app",
                  "sha256_cert_fingerprints": ["..."] }}]
   ```
4. Submit for review

### Alternative: PWABuilder
Visit [pwabuilder.com](https://pwabuilder.com), paste your PWA URL, download the Android package. No CLI required.

---

## M. Testing Strategy

### Backend TypeScript Compilation
```bash
cd backend && npx tsc --noEmit
```

### Frontend TypeScript Compilation
```bash
cd web && npx tsc --noEmit
```

### Dev Servers
```bash
# Terminal 1
cd backend && npm run dev   # Port 5000

# Terminal 2
cd web && npm run dev        # Port 5173
```

### Seed Data
```bash
cd backend && npx ts-node src/seed.ts
# ✅ Seeded 10 templates successfully!
```

### Manual API Verification
```bash
# Health check
curl http://localhost:5000/health

# Templates (public)
curl http://localhost:5000/api/trackers/templates | jq '.data | length'
# → 10

# Create planner
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trackos.com","password":"admin123"}' | jq -r '.token')

curl -X POST http://localhost:5000/api/planners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Daily Plan"}' | jq '.data._id'
```

### Manual UI Verification Checklist
- [ ] `/templates` — grid loads, category filter works, preview modal opens, "Use This Template" navigates
- [ ] `/planners` — cards show completion %, create blank works, delete works
- [ ] `/planners/:id` — blocks can be added, text editable, auto-save fires (Network tab shows PUT after 2s)
- [ ] Task block — check/uncheck items, progress bar updates
- [ ] Reminder bell — set reminder, browser asks permission, notification fires at time
- [ ] `/calendar` — monthly grid renders, day click opens panel, planners appear on correct days
- [ ] Dashboard — Quick Access cards navigate to Templates/Planners/Calendar
- [ ] PWA — Chrome DevTools → Application → Manifest loaded, SW registered, "Add to Home Screen" appears

---

## N. Future Roadmap

### Phase 2 (P1 — Post-MVP)
- Drag-and-drop block reorder (react-beautiful-dnd or @dnd-kit)
- PWA push notifications via Web Push API (server-sent)
- Planner tags and filters

### Phase 3 (P2 — Nice to Have)
- Drawing canvas block (HTML5 Canvas API)
- Image upload block (S3 / Cloudinary)
- Export planner as PDF (jsPDF)
- Collaborative editing (WebSocket + Yjs CRDT)
- Planner sharing via public short links

### Phase 4 (Enterprise)
- Multi-workspace (team accounts)
- Role-based access control
- API rate limiting per user tier
- Analytics dashboard (chart.js / recharts extended)

---

## O. Deployment

### Docker Compose (Local / Self-hosted)
```yaml
# docker-compose.yml already exists
docker-compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:5000
# MongoDB:  localhost:27017
```

### AWS EC2 (Production)
See [AWS_EC2_DEPLOYMENT.md](./AWS_EC2_DEPLOYMENT.md) for full guide. Summary:
1. `docker-compose up -d` on EC2 instance
2. Nginx reverse proxy (already configured in `web/nginx.conf`)
3. SSL via Let's Encrypt Certbot
4. MongoDB Atlas for managed database

### Vercel + Railway (Serverless)
- Frontend: `vercel --prod` from `/web` directory
- Backend: Railway.app with `npm start` (uses compiled `dist/`)
- Database: MongoDB Atlas free tier

---

## P. Known Limitations & Trade-offs

| Limitation | Rationale / Trade-off |
|-----------|----------------------|
| No drag-and-drop block reorder | Deferred to P1 to prioritise core block editing experience |
| Schedule block type defined in model but not rendered | Reserved for future; won't cause errors |
| Service worker caches only shell | Full offline data sync requires IndexedDB + sync strategy — P2 scope |
| ReminderBell polls every 60s | Acceptable for MVP; production would use Web Push for server-initiated notifications |
| Single `.env` for all AI keys | Production would use secret manager (AWS Secrets Manager / Vault) |
| No rate limiting | Express `express-rate-limit` would be added before public launch |
| CORS allows all origins | `cors({ origin: process.env.FRONTEND_URL })` in production |
