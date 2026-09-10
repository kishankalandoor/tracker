# API Reference — TrackOS

**Base URL:** `http://127.0.0.1/api`  
**Auth:** All protected routes require `Authorization: Bearer <JWT>` header.  
**Content-Type:** `application/json`

---

## Authentication

### POST `/auth/register`
Create a new user account.

**Request body:**
```json
{
  "name": "Kishan",
  "email": "kishan@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Kishan",
    "email": "kishan@example.com",
    "token": "<JWT>"
  }
}
```

---

### POST `/auth/login`
Authenticate and receive a JWT.

**Request body:**
```json
{
  "email": "kishan@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Kishan",
    "email": "kishan@example.com",
    "token": "<JWT>"
  }
}
```

---

## Trackers

### GET `/trackers` 🔒
List all trackers owned by the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "abc123",
      "name": "Marathon Training",
      "category": "Health",
      "description": "Track daily runs",
      "fields": [
        { "fieldKey": "distance_km", "label": "Distance (km)", "type": "number", "required": true },
        { "fieldKey": "notes", "label": "Notes", "type": "text", "required": false }
      ],
      "ownerId": "...",
      "isTemplate": false
    }
  ]
}
```

---

### POST `/trackers` 🔒
Create a new tracker definition.

**Request body:**
```json
{
  "name": "Marathon Training",
  "category": "Health",
  "description": "Track daily runs",
  "fields": [
    { "fieldKey": "distance_km", "label": "Distance (km)", "type": "number", "required": true }
  ],
  "isTemplate": false
}
```

**Response `201`:** Returns the created `TrackerDefinition` document.

---

### DELETE `/trackers/:id` 🔒
Delete a tracker and all its entries.

**Response `200`:**
```json
{ "success": true }
```

---

### GET `/trackers/:id/entries` 🔒
Get all entries for a specific tracker.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "trackerId": "abc123",
      "ownerId": "...",
      "data": { "distance_km": 10.5, "notes": "Good run" },
      "createdAt": "2026-09-09T07:00:00.000Z"
    }
  ]
}
```

---

### POST `/trackers/:id/entries` 🔒
Log a new entry for a tracker.

**Request body:**
```json
{
  "data": { "distance_km": 10.5, "notes": "Good run" }
}
```

**Response `201`:** Returns the created `TrackerEntry` document.

---

## Routines

### GET `/routines` 🔒
List all routines owned by the user.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Morning Productivity Routine",
      "tasks": [
        {
          "taskName": "Meditation",
          "estimatedMinutes": 15,
          "startTime": "07:00",
          "endTime": "07:15",
          "isCompleted": false,
          "aiNotes": "Start the day with a clear mind"
        }
      ],
      "ownerId": "...",
      "createdAt": "..."
    }
  ]
}
```

---

### POST `/routines` 🔒
Create a new routine.

**Request body:**
```json
{
  "title": "Morning Productivity Routine",
  "tasks": [
    {
      "taskName": "Meditation",
      "estimatedMinutes": 15,
      "startTime": "07:00",
      "endTime": "07:15"
    }
  ]
}
```

---

### PUT `/routines/:id` 🔒
Update a routine (commonly used for toggling task completion or editing tasks inline).

**Request body:** Any subset of Routine fields, e.g.:
```json
{
  "tasks": [
    {
      "taskName": "Meditation",
      "estimatedMinutes": 15,
      "startTime": "07:00",
      "endTime": "07:15",
      "isCompleted": true
    }
  ]
}
```

---

### DELETE `/routines/:id` 🔒
Delete a routine.

---

## AI Endpoints

### POST `/ai/generate` 🔒
Generate a tracker schema from a natural language prompt.  
Returns a draft for human review — **does not save to DB**.

**Request body:**
```json
{ "prompt": "I want to track my marathon training with pace, distance and heart rate" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "name": "Marathon Training Tracker",
    "category": "Health",
    "description": "Track your marathon training sessions",
    "fields": [
      { "fieldKey": "distance_km", "label": "Distance (km)", "type": "number", "required": true },
      { "fieldKey": "pace_min_km", "label": "Pace (min/km)", "type": "number", "required": false },
      { "fieldKey": "heart_rate", "label": "Heart Rate (bpm)", "type": "number", "required": false }
    ]
  }
}
```

---

### POST `/ai/routine/generate` 🔒
Generate a routine timetable from a natural language prompt.  
Returns a draft for human review — **does not save to DB**.

**Request body:**
```json
{ "prompt": "Build a 6-hour focused deep work session for a software developer" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "title": "6-Hour Deep Work Session",
    "tasks": [
      { "taskName": "Morning Standup & Planning", "estimatedMinutes": 15, "startTime": "09:00", "endTime": "09:15" },
      { "taskName": "Deep Work Block 1", "estimatedMinutes": 90, "startTime": "09:15", "endTime": "10:45" }
    ]
  }
}
```

---

### POST `/ai/routine/suggest` 🔒
Get an AI co-pilot suggestion for the next task in an active routine.

**Request body:**
```json
{
  "routineTitle": "Morning Productivity Routine",
  "pendingTasks": ["Meditation", "Cold Shower", "Email Review"],
  "contextPrompt": "Based on my progress, what should I do right now?"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "suggestion": "Start with Meditation now to set a focused mindset before diving into emails."
  }
}
```

---

## Chat (Persistent Conversations)

### GET `/chat/conversations` 🔒
List all conversations for the user, sorted by most recent.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "_id": "conv123", "title": "Help me plan my day", "updatedAt": "2026-09-09T07:30:00.000Z" }
  ]
}
```

---

### POST `/chat/conversations` 🔒
Create a new conversation.

**Request body:**
```json
{ "title": "New Chat" }
```

---

### DELETE `/chat/conversations/:id` 🔒
Delete a conversation and all its messages.

---

### GET `/chat/conversations/:id/messages` 🔒
Get all messages in a conversation, sorted chronologically.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "conversationId": "conv123", "role": "user", "content": "What tasks should I do today?", "createdAt": "..." },
    { "_id": "...", "conversationId": "conv123", "role": "assistant", "content": "Based on your routines...", "executedAction": null, "createdAt": "..." }
  ]
}
```

---

### POST `/chat/conversations/:id/messages` 🔒
Send a message and receive an AI response.

**Request body:**
```json
{ "content": "Mark my morning workout as done" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userMessage": { "role": "user", "content": "Mark my morning workout as done", ... },
    "assistantMessage": {
      "role": "assistant",
      "content": "Done! I've marked your morning workout as completed.",
      "executedAction": "✅ Marked \"Morning Workout\" as completed in \"Morning Routine\"",
      ...
    }
  }
}
```

---

## Error Shape

All errors return a consistent shape:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description"
  }
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Validation error / bad request body |
| `401` | Missing or invalid JWT |
| `403` | Forbidden (resource not owned by user) |
| `404` | Resource not found |
| `500` | Internal server error / AI model failure |
