# TrackOS — AI-Powered Universal Productivity Tracker

> **Version:** 1.0.0 · **Status:** Production MVP · **Stack:** Node/Express · React/Vite · MongoDB · OmniRoute AI

TrackOS is a full-stack, AI-first productivity platform that lets users create custom trackers, build AI-generated routines, and interact with a persistent ChatGPT-like assistant — all in one unified dark-mode interface.

---

## Quick Links

| Document | Description |
|---|---|
| [Architecture](./docs/ARCHITECTURE.md) | System design, component diagram, data flow |
| [API Reference](./docs/API.md) | All REST endpoints with request/response schemas |
| [Database Schema](./docs/DATABASE.md) | MongoDB collections and field definitions |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Docker, environment variables, AWS EC2 setup |
| [AI Integration](./docs/AI_INTEGRATION.md) | OmniRoute, model fallback, prompt engineering |
| [Technical Decisions](./docs/DECISIONS.md) | Key assumptions and trade-offs |
| [Developer Guide](./docs/DEVELOPER_GUIDE.md) | Local setup, code structure, troubleshooting |

---

## Features

- 🤖 **AI Tracker Generator** — Describe what you want to track; AI generates a full schema for human review before saving
- 📅 **AI Routine Maker** — Natural language → timed timetable with start/end times; fully editable before approval
- 💬 **Persistent Chatbot** — ChatGPT-like interface with MongoDB-backed conversation history, never forgets
- 📊 **Entry Logging & Charts** — Log entries against any tracker, visualise with bar charts
- 🌓 **Global Theme Toggle** — Dark/light mode persisted across all pages via localStorage
- 🔒 **JWT Authentication** — Secure register/login with bcrypt password hashing

---

## Getting Started (30 seconds)

```bash
git clone <repo-url>
cd universal-tracker
docker compose up -d --build
```

Open → **http://127.0.0.1**

> Requires: Docker Desktop ≥ 4.x · OmniRoute running on `localhost:20128`

---

## Project Structure

```
universal-tracker/
├── backend/              # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/  # Route handlers (AI, Auth, Tracker, Routine, Chat)
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── middleware/   # Auth + error handling
│   │   └── index.ts      # App entry point
│   └── Dockerfile
├── web/                  # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── pages/        # Dashboard, Routines, Chatbot
│   │   ├── components/   # UniversalForm, shared UI
│   │   ├── store/        # Zustand state (auth)
│   │   ├── services/     # Axios API client
│   │   ├── utils/        # theme.ts (global dark/light)
│   │   └── types/        # Shared TypeScript interfaces
│   └── Dockerfile
├── docs/                 # Full technical documentation
├── docker-compose.yml    # 3-service orchestration
└── README.md
```
