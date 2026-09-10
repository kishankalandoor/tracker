# AI Integration — TrackOS

---

## Overview

TrackOS uses an **OpenAI-compatible API gateway** (OmniRoute) to route requests to multiple LLM providers. The integration is designed for **reliability under quota limits** — if any model returns a 403 or 429, the system automatically falls back to the next model in the priority list.

---

## OmniRoute Gateway

OmniRoute acts as a local proxy that:
- Accepts the OpenAI SDK format (`/v1/chat/completions`)
- Routes to multiple providers (Anthropic, OpenAI, DeepSeek, etc.) via a single API key
- Tracks usage, costs, and rate limits per provider

**Local URL:** `http://localhost:20128/v1`  
**Docker internal URL:** `http://host.docker.internal:20128/v1`  
**Dashboard:** `http://localhost:20128/dashboard`

---

## Model Priority List

The backend tries models in this order. On quota/rate limit errors (HTTP 403, 429), it moves to the next:

```typescript
const MODELS_TO_TRY = [
  'agy/claude-sonnet-4-6',       // Primary — best quality/speed balance
  'agentrouter/claude-opus-5',   // Fallback 1 — high capability
  'agentrouter/gpt-5.6-sol',     // Fallback 2 — OpenAI
  'agentrouter/claude-opus-4-8', // Fallback 3
  'agentrouter/glm-5.3',         // Fallback 4
  'agentrouter/deepseek-v4-flash', // Fallback 5 — fast, lower cost
];
```

If **all models fail**, the error from the last attempt is thrown and returned as HTTP 500.

---

## Fallback Engine

```typescript
const generateWithFallback = async (messages, temperature = 0.2) => {
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await openai.chat.completions.create({ model, messages, temperature });
      return response.choices[0].message?.content || '{}';
    } catch (error) {
      if (error.status === 403 || error.status === 429) continue; // quota/rate limit
      // Non-quota errors: still try next model
    }
  }
  throw lastError;
};
```

This approach means:
- **Zero manual intervention** needed for quota exhaustion
- **Transparent to the user** — they see their result, not which model produced it
- **Cost-aware** — cheapest models (DeepSeek) used as last resort

---

## AI Use Cases

### 1. Tracker Schema Generation

**Temperature:** 0.1 (very deterministic)  
**Endpoint:** `POST /api/ai/generate`

**System prompt strategy:**
- Instructs model to output **only strict JSON** — no prose
- Defines exact schema shape: `{ name, category, description, fields[] }`
- Each field has: `fieldKey`, `label`, `type`, `required`, `options`

**Human-in-the-loop:** The response is displayed as a draft. Users can edit field names, types, required flags, add/remove fields, then click "Approve & Save" — the schema is **never auto-saved**.

---

### 2. Routine Timetable Generation

**Temperature:** 0.2 (mostly deterministic)  
**Endpoint:** `POST /api/ai/routine/generate`

**System prompt strategy:**
- Instructs model to produce a time-sequenced JSON array of tasks
- Assumes 09:00 start if not specified
- Calculates `startTime` and `endTime` for each task sequentially in `HH:MM` format

**Human-in-the-loop:** Same draft review pattern — displayed for editing before saving.

---

### 3. AI Co-Pilot Suggestions

**Temperature:** 0.7 (creative, conversational)  
**Endpoint:** `POST /api/ai/routine/suggest`

Provides one-sentence motivational recommendation on which pending task to tackle next, based on the routine title and list of incomplete tasks. Pure text response (no JSON parsing needed).

---

### 4. Persistent Chat Assistant

**Temperature:** 0.7  
**Endpoint:** `POST /api/chat/conversations/:id/messages`

**Context injected into every message:**
1. **Full conversation history** — last 20 messages retrieved from MongoDB
2. **User's routines** — all active routines and their task completion state

**Action parsing:**  
The AI can embed a structured action block in its response:
```
```action
{"type": "COMPLETE_TASK", "routineId": "abc123", "taskName": "Morning Workout"}
```
```

The backend:
1. Detects the action block via regex
2. Parses and executes the DB mutation (Mongoose update)
3. Strips the action block from the displayed reply
4. Stores the `executedAction` description with the message

---

## JSON Extraction Strategy

AI models sometimes wrap JSON in markdown code fences. The `extractJSON` helper handles all cases:

```typescript
const extractJSON = (text: string) => {
  // 1. Try markdown code fence: ```json ... ```
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match?.[1]) return JSON.parse(match[1]);

  // 2. Try raw JSON parse
  try { return JSON.parse(text); } catch {}

  // 3. Find first { to last } and parse
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return JSON.parse(text.substring(start, end + 1));

  throw new Error('Failed to parse JSON from AI response');
};
```

---

## Prompt Engineering Principles

| Principle | Application |
|---|---|
| **Explicit output format** | System prompt always shows the exact JSON structure expected |
| **"Output only JSON"** | Prevents prose that breaks JSON parsing |
| **Low temperature for structure** | 0.1–0.2 for schema generation ensures consistent output |
| **Higher temperature for conversation** | 0.7 for chat/suggestions feels natural |
| **Context injection** | Routines and chat history injected so AI is always aware of user's data |
| **Fallback models** | Never block on a single model; degrade gracefully |

---

## Adding a New AI Feature

1. Add a new controller function in `aiController.ts` or `chatController.ts`
2. Use `generateWithFallback(messages, temperature)` — do not call OpenAI directly
3. Add your route in the appropriate `*Routes.ts` file
4. Protect with `protect` middleware if user-scoped

Example:
```typescript
export const generateWeeklySummary = async (req: AuthRequest, res: Response) => {
  const { entries } = req.body;
  const content = await generateWithFallback([
    { role: 'system', content: 'You are a productivity analyst. Given tracker entries, output a weekly summary in 3 bullet points.' },
    { role: 'user', content: JSON.stringify(entries) }
  ], 0.5);
  res.json({ success: true, data: { summary: content } });
};
```

---

## Limitations & Future Improvements

| Limitation | Future Fix |
|---|---|
| No streaming responses | Add `stream: true` for real-time token output (SSE) |
| Context window limited to 20 messages | Implement sliding window with summarisation |
| No tool/function calling | Use OpenAI function calling for more reliable DB actions |
| API keys in code | Move all keys to env vars; rotate via secrets manager |
| No retry with backoff | Add exponential backoff for network errors (not just quota) |
