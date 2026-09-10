# Database Schema — TrackOS

**Database:** MongoDB 6 (NoSQL document store)  
**ODM:** Mongoose 7  
**Connection:** `mongodb://mongodb:27017/universal_tracker` (Docker internal)

---

## Collections

### `users`

Stores registered user accounts.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | MongoDB primary key |
| `name` | String | ✓ | Display name |
| `email` | String | ✓ | Unique, indexed |
| `password` | String | ✓ | bcrypt hash (10 rounds) |
| `createdAt` | Date | auto | Mongoose timestamps |
| `updatedAt` | Date | auto | Mongoose timestamps |

**Indexes:** `email` (unique)

```js
// Schema
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}
```

---

### `trackerdefinitions`

Defines the schema/structure of a custom tracker. One document per tracker type.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `name` | String | ✓ | e.g. "Marathon Training" |
| `category` | String | ✓ | e.g. "Health", "Finance", "Study" |
| `description` | String | | Short human-readable description |
| `fields` | Array | ✓ | Array of `FieldDefinition` sub-documents |
| `ownerId` | ObjectId | ✓ | Ref → `users._id` |
| `isTemplate` | Boolean | | `false` = user-owned, `true` = shared template |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**FieldDefinition sub-document:**

| Field | Type | Notes |
|---|---|---|
| `fieldKey` | String | Unique key used in entry `data` map |
| `label` | String | Human-readable label shown in UI |
| `type` | String | `text`, `number`, `boolean`, `date`, `select` |
| `required` | Boolean | Whether the field is mandatory |
| `options` | [String] | Only for `type: "select"` |

**Indexes:** None beyond default `_id`. Queries always scoped by `ownerId`.

```js
// Example document
{
  "_id": "ObjectId(...)",
  "name": "Marathon Training",
  "category": "Health",
  "description": "Track runs with pace and distance",
  "fields": [
    { "fieldKey": "distance_km", "label": "Distance (km)", "type": "number", "required": true },
    { "fieldKey": "pace", "label": "Pace (min/km)", "type": "number", "required": false },
    { "fieldKey": "notes", "label": "Notes", "type": "text", "required": false }
  ],
  "ownerId": "ObjectId(...)",
  "isTemplate": false,
  "createdAt": "2026-09-09T07:00:00.000Z"
}
```

---

### `trackerentries`

Stores individual logged entries for a tracker. Schema is flexible — `data` is a free-form Map.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `trackerId` | ObjectId | ✓ | Ref → `trackerdefinitions._id` |
| `ownerId` | ObjectId | ✓ | Ref → `users._id` |
| `data` | Map(String, Mixed) | ✓ | Key-value pairs matching tracker's `fieldKey` values |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

```js
// Example document
{
  "_id": "ObjectId(...)",
  "trackerId": "ObjectId(...)",
  "ownerId": "ObjectId(...)",
  "data": {
    "distance_km": 10.5,
    "pace": 5.2,
    "notes": "Great run, felt strong"
  },
  "createdAt": "2026-09-09T06:30:00.000Z"
}
```

---

### `routines`

Stores AI-generated (or manually created) timed routines with task arrays.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `ownerId` | ObjectId | ✓ | Ref → `users._id` |
| `title` | String | ✓ | e.g. "Morning Productivity Routine" |
| `tasks` | Array | | Array of `RoutineTask` sub-documents |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**RoutineTask sub-document:**

| Field | Type | Notes |
|---|---|---|
| `taskName` | String | Name of the task |
| `estimatedMinutes` | Number | Duration in minutes |
| `startTime` | String | `HH:MM` 24-hour format (e.g. `"09:00"`) |
| `endTime` | String | `HH:MM` 24-hour format |
| `isCompleted` | Boolean | Toggled by user; default `false` |
| `aiNotes` | String | Optional AI-generated description |

```js
// Example document
{
  "_id": "ObjectId(...)",
  "ownerId": "ObjectId(...)",
  "title": "6-Hour Deep Work Session",
  "tasks": [
    { "taskName": "Plan the day", "estimatedMinutes": 15, "startTime": "09:00", "endTime": "09:15", "isCompleted": true, "aiNotes": "Review todos and set priorities" },
    { "taskName": "Deep Work Block 1", "estimatedMinutes": 90, "startTime": "09:15", "endTime": "10:45", "isCompleted": false }
  ],
  "createdAt": "2026-09-09T07:00:00.000Z"
}
```

---

### `conversations`

Tracks persistent chat sessions (one per user thread, like ChatGPT conversations).

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `title` | String | ✓ | Auto-set from first message (truncated to 40 chars) |
| `ownerId` | ObjectId | ✓ | Ref → `users._id` |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | Updated on each new message |

**Indexes:** Queries sorted by `updatedAt: -1` for recency.

---

### `chatmessages`

Individual messages within a conversation. Supports conversation memory.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | |
| `conversationId` | ObjectId | ✓ | Ref → `conversations._id` |
| `role` | String | ✓ | `"user"` or `"assistant"` |
| `content` | String | ✓ | Full message text |
| `executedAction` | String | | Human-readable description of DB action taken, e.g. `"✅ Marked 'Task' as completed"` |
| `createdAt` | Date | auto | |

```js
// Example assistant message with action
{
  "_id": "ObjectId(...)",
  "conversationId": "ObjectId(...)",
  "role": "assistant",
  "content": "Done! I've marked your morning workout as completed.",
  "executedAction": "✅ Marked \"Morning Workout\" as completed in \"Morning Routine\"",
  "createdAt": "2026-09-09T07:35:00.000Z"
}
```

---

## Relationships Diagram

```
users
  |
  |--< trackerdefinitions (ownerId)
  |         |
  |         |--< trackerentries (ownerId, trackerId)
  |
  |--< routines (ownerId)
  |
  |--< conversations (ownerId)
            |
            |--< chatmessages (conversationId)
```

---

## Design Decisions

1. **Flexible `data` map in TrackerEntry** — allows any tracker schema without schema migrations. New fields are automatically captured.
2. **Embedded tasks array in Routine** — tasks are always read with their routine, no join needed.
3. **Separate Conversation + ChatMessage** — enables listing conversations without loading all messages (pagination-ready).
4. **No soft deletes** — hard deletes cascade (conversation delete removes all messages). Sufficient for MVP.
5. **No compound indexes** — all queries filter by `ownerId` first; acceptable at MVP scale. Add compound indexes (`ownerId + createdAt`) when scale requires.
