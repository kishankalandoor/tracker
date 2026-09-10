# Architecture — TrackOS

## Overview

TrackOS follows a **3-tier containerised architecture**: a React SPA served by Nginx, an Express REST API, and a MongoDB database — all orchestrated by Docker Compose.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP :80
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   Nginx (container: universal_tracker_web)                      │
│   • Serves React/Vite static build                              │
│   • Proxies /api/* → backend:5000                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP :5000 (internal Docker network)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   Express API (container: universal_tracker_api)                │
│   • REST endpoints for Auth, Trackers, Routines, AI, Chat       │
│   • JWT middleware on protected routes                           │
│   • Calls OmniRoute AI gateway via host.docker.internal:20128   │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               │ MongoDB                      │ HTTP (OpenAI-compat)
               ▼                              ▼
┌──────────────────────────┐   ┌─────────────────────────────────┐
│ MongoDB 6                │   │ OmniRoute AI Gateway            │
│ (container: tracker_db)  │   │ localhost:20128/v1               │
│ Persistent named volume  │   │ Primary: agy/claude-sonnet-4-6  │
│ Port 27017 (local only)  │   │ 5 additional fallback models    │
└──────────────────────────┘   └─────────────────────────────────┘
```

---

## Component Responsibilities

### Frontend (React + Vite + TypeScript)

| Component | Responsibility |
|---|---|
| `Dashboard.tsx` | AI Tracker Generator with human approval flow; entry logging; bar charts |
| `Routines.tsx` | AI Routine Maker with editable timetable; inline task editing; AI Co-Pilot |
| `Chatbot.tsx` | Persistent ChatGPT-like interface; conversation sidebar; DB action execution |
| `authStore.ts` | Zustand store for JWT token + user info; persisted to localStorage |
| `api.ts` | Base Axios instance; auto-attaches `Authorization: Bearer <token>` |
| `theme.ts` | Global dark/light theme via `body[data-theme]`; persisted to localStorage |
| `UniversalForm.tsx` | Renders any tracker's dynamic field array into a typed form |

### Backend (Express + TypeScript)

| Module | Responsibility |
|---|---|
| `authController` | Register/login with bcrypt; returns signed JWT |
| `trackerController` | CRUD for TrackerDefinition; entry logging per tracker |
| `routineController` | CRUD for Routine documents |
| `aiController` | OmniRoute wrapper with 6-model fallback; tracker schema, routine, AI suggestions, legacy chat |
| `chatController` | Persistent chat — creates Conversations, stores ChatMessages, injects routine context, executes DB actions |
| `authMiddleware` | Verifies JWT, attaches `req.user` |
| `errorMiddleware` | Global error handler; consistent JSON error shape |

---

## Request Flow: AI Tracker Generation

```
User types prompt
      |
      v
Dashboard.tsx  -->  POST /api/ai/generate  -->  aiController.generateTrackerSchema
                                                      |
                                            generateWithFallback(models)
                                                      | tries agy/claude-sonnet-4-6
                                                      | falls back through 5 models on 403/429
                                                      v
                                            OmniRoute --> Claude / GPT / DeepSeek
                                                      |
                                            extractJSON(rawText)
                                                      |
                                            { name, category, description, fields[] }
                                                      |
                                            <---------+ returned to browser
      |
      v
Human reviews AI draft (can edit fields, add/remove, rename types)
      |  clicks "Approve & Save"
      v
POST /api/trackers  -->  TrackerDefinition saved to MongoDB
```

---

## Request Flow: Persistent Chat

```
User sends message
      |
      v
Chatbot.tsx
  1. If no conversation --> POST /api/chat/conversations  (auto-creates)
  2. POST /api/chat/conversations/:id/messages  { content }
                |
                v
        chatController.sendChatMessage
          1. Save user ChatMessage to MongoDB
          2. Fetch last 20 messages for window context
          3. Fetch user Routines (injected as system prompt context)
          4. Call generateWithFallback (OpenAI-compatible)
          5. Parse action block if present --> execute DB mutation
          6. Save assistant ChatMessage (with executedAction field)
                |
                v
        { userMessage, assistantMessage }  <-- returned to browser
      |
      v
UI: both messages appended; title auto-set from first message
```

---

## Security Boundaries

- JWT secret via environment variable — never hard-coded in production
- MongoDB bound to `127.0.0.1:27017` — not exposed publicly
- Frontend served on `127.0.0.1:80` — reverse proxy in production  
- AI API keys in environment variables (see DEPLOYMENT.md)
- bcrypt rounds = 10 for password hashing

---

## Scalability Path

| Concern | Current (MVP) | Production Path |
|---|---|---|
| Database | Single MongoDB container | MongoDB Atlas (managed, replicated) |
| AI routing | OmniRoute local gateway | OmniRoute cloud or direct vendor keys |
| Auth | JWT stateless | No change needed |
| Rate limiting | None | `express-rate-limit` middleware |
| Horizontal API | Single container | Load balancer + multiple API replicas |
| File storage | None | AWS S3 for attachments if needed |
