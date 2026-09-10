# TrackOS — User Flow Documentation

## Overview

TrackOS supports four primary user journeys, each documented with an ASCII flow diagram.

---

## Flow 1: New User Registration & First Tracker

```
┌──────────────────────────────────────────────────────┐
│  User lands on /login                                │
│  ┌─────────────────────┐                             │
│  │  Enter name/email/  │                             │
│  │  password → REGISTER│                             │
│  └────────┬────────────┘                             │
│           │ JWT token returned                       │
│           ▼                                          │
│  Redirect → / (Dashboard)                            │
│           │                                          │
│  ┌────────▼────────────────────────┐                │
│  │  Empty state: "Build Your       │                │
│  │  First Tracker"                 │                │
│  │  Input: "Describe what to track"│                │
│  └────────┬────────────────────────┘                │
│           │ AI Generate                              │
│           ▼                                          │
│  ┌────────────────────┐                              │
│  │  AI Draft Preview  │  ← Human reviews fields     │
│  │  [Edit] [Approve]  │  ← Can edit name/fields     │
│  │  [Discard]         │                              │
│  └────────┬───────────┘                              │
│           │ Approve & Save                           │
│           ▼                                          │
│  Tracker created → Log first entry → Chart appears  │
└──────────────────────────────────────────────────────┘
```

---

## Flow 2: Template → Planner Creation → Edit → Reminder → Complete

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar → "Templates"                                       │
│           │                                                  │
│  ┌────────▼─────────────────────────────────────────────┐   │
│  │  Template Library (/templates)                       │   │
│  │  • Category filter: All / Personal / Health / ...   │   │
│  │  • Search bar                                        │   │
│  │  • Grid of 10 template cards                         │   │
│  └────────┬─────────────────────────────────────────────┘   │
│           │ Click "Preview" → Modal shows fields             │
│           │ Click "Use This Template"                        │
│           │ POST /api/trackers/templates/:id/download        │
│           ▼                                                  │
│  Redirect → /planners?newFromTemplate=<id>                   │
│           │ Auto-creates planner via POST /api/planners      │
│           │ with pre-filled content blocks from template     │
│           ▼                                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PlannerEditor (/planners/:id)                         │ │
│  │  • Sticky header: title, emoji, save status            │ │
│  │  • Content blocks: Note (template desc) + Task list    │ │
│  │  • + Text / + Task List / + Checklist / + Note toolbar │ │
│  │  • Undo / Redo                                         │ │
│  │  • Auto-save every 2s on change                        │ │
│  └────────┬───────────────────────────────────────────────┘ │
│           │ Click 🔔 (Bell icon)                             │
│           ▼                                                  │
│  Reminder Panel opens:                                       │
│  • Pick date/time → Note (optional)                         │
│  • Save → POST /api/reminders                               │
│  • Browser asks Notification permission                     │
│  • Bell turns yellow (active)                               │
│           │                                                  │
│  ... time passes ...                                         │
│           │                                                  │
│  ReminderBell component fires browser Notification          │
│           │                                                  │
│  User returns → Click "Mark Done" → isCompleted = true      │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow 3: AI Chatbot Interaction

```
┌───────────────────────────────────────────────────┐
│  Sidebar → "AI Chat"                               │
│           │                                        │
│  ┌────────▼──────────────────────────────────────┐ │
│  │  Chatbot Page (/chatbot)                      │ │
│  │  • Conversation history persisted in MongoDB  │ │
│  │  • User types message → POST /api/chat        │ │
│  │  • AI (Gemini) responds with context-aware    │ │
│  │    answers about routines, trackers, planners │ │
│  │  • "Clear Chat" resets conversation           │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  Example interactions:                             │
│  "What trackers do I have?"                       │
│  "Help me plan a morning routine"                  │
│  "Suggest a study planner for GATE exam"           │
└───────────────────────────────────────────────────┘
```

---

## Flow 4: Routine Scheduling

```
┌──────────────────────────────────────────────────────┐
│  Sidebar → "Routines"                                │
│           │                                          │
│  ┌────────▼─────────────────────────────────────┐   │
│  │  Routines Page (/routines)                   │   │
│  │  • List of saved routines                    │   │
│  │  • "Generate with AI" button                 │   │
│  └────────┬─────────────────────────────────────┘   │
│           │ Describe routine                         │
│           │ POST /api/ai/routine                     │
│           ▼                                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │  AI generates routine tasks with:               │ │
│  │  • taskName, estimatedMinutes                   │ │
│  │  • startTime, endTime (auto-calculated)         │ │
│  │  • aiNotes per task                             │ │
│  └────────┬────────────────────────────────────────┘ │
│           │ User reviews, edits, saves               │
│           ▼                                          │
│  Routine saved → Checklist UI to mark tasks done    │
└──────────────────────────────────────────────────────┘
```

---

## Flow 5: Calendar Navigation

```
┌──────────────────────────────────────────────────────┐
│  Sidebar → "Calendar" OR PlannerEditor → 📅 button  │
│           │                                          │
│  ┌────────▼──────────────────────────────────────┐  │
│  │  CalendarView (/calendar)                     │  │
│  │  • Month/Year header with prev/next arrows    │  │
│  │  • "Today" shortcut button                    │  │
│  │  • 7-column day grid                          │  │
│  │    - Planner emoji badges on each day         │  │
│  │    - Yellow dot = upcoming reminder           │  │
│  │    - Today highlighted in purple              │  │
│  └────────┬──────────────────────────────────────┘  │
│           │ Click on any day                         │
│           ▼                                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Day Detail Panel slides in (right side)        │ │
│  │  • Lists planners updated/created on that day  │ │
│  │  • Shows reminder time if set                  │ │
│  │  • Click planner → navigate to editor          │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```
