# TrackOS — Planner MVP Feature Priorities

## Feature Prioritisation Matrix

| Priority | Feature | Status | Notes |
|----------|---------|--------|-------|
| **P0 — Must Have** | | | |
| ✅ | Template Library (10 templates, 6 categories) | **Done** | Backend-driven, never hard-coded |
| ✅ | Planner CRUD (Create / Read / Update / Delete) | **Done** | `/api/planners` full REST |
| ✅ | Content Blocks (Text, Task, Checklist, Note) | **Done** | PlannerEditor.tsx |
| ✅ | Reminders (create, acknowledge, browser notification) | **Done** | ReminderBell polls every 60s |
| ✅ | Auto-save (2s debounce) | **Done** | Saves on every change |
| ✅ | Calendar View (monthly grid, day detail panel) | **Done** | CalendarView.tsx |
| ✅ | JWT Authentication | **Done** | All planner routes protected |
| ✅ | AI Tracker Generator with HITL approval | **Done** | Dashboard + AI endpoint |
| ✅ | Routines with AI Co-pilot | **Done** | Routines page |
| ✅ | Persistent AI Chatbot | **Done** | Chatbot page |
| **P1 — Should Have** | | | |
| ✅ | PWA Manifest & Theme | **Done** | manifest.json + theme-color |
| ✅ | Service Worker (App Shell cache) | **Done** | sw.js |
| ✅ | Offline shell fallback | **Done** | SW cache-first for static assets |
| ✅ | Sidebar navigation (shared component) | **Done** | Sidebar.tsx |
| ✅ | Dark / Light mode toggle | **Done** | theme.ts utility |
| ⬜ | Drag-and-drop block reorder | **Roadmap** | P1 post-MVP |
| ✅ | Undo / Redo (local command stack) | **Done** | PlannerEditor |
| ✅ | Completion % progress bar | **Done** | Planners grid + PlannerEditor |
| ✅ | "Mark Complete" toggle | **Done** | PlannerEditor header |
| **P2 — Nice to Have** | | | |
| ⬜ | Drawing canvas block | **Roadmap** | Canvas API integration |
| ⬜ | Image upload block | **Roadmap** | S3 / Cloudinary |
| ⬜ | Stickers / emoji reactions | **Roadmap** | UX delight |
| ⬜ | Collaborative editing | **Roadmap** | WebSocket / CRDT |
| ⬜ | Export planner as PDF | **Roadmap** | PDF generation library |
| ⬜ | Planner sharing (public links) | **Roadmap** | Short URL service |

## Summary

- **P0 complete**: 10/10 Must Have features delivered ✅
- **P1 partially complete**: PWA, offline, sidebar, theme done; drag-drop deferred
- **P2**: All documented as roadmap items in SUBMISSION.md
