import { Request, Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../middleware/authMiddleware';
import { Routine } from '../models/Routine';
import {
  aiGenerationTotal, aiGenerationDuration,
  aiRoutineTotal, errorCounter
} from '../middleware/metrics';

const openai = new OpenAI({
  apiKey: 'sk-4bgz5xzHe3aHRP0dNIgSWcxQl1u2pvD4ndShdfUVuCIeH2c8',
  baseURL: 'http://host.docker.internal:20128/v1'
});

const MODELS_TO_TRY = [
  'agy/claude-sonnet-4-6',
  'agentrouter/claude-opus-5',
  'agentrouter/gpt-5.6-sol',
  'agentrouter/claude-opus-4-8',
  'agentrouter/glm-5.3',
  'agentrouter/deepseek-v4-flash',
];

// Robust wrapper to try multiple models automatically
const generateWithFallback = async (messages: any[], temperature: number = 0.2) => {
  let lastError = null;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[AI] Attempting with model: ${model}`);
      const response = await openai.chat.completions.create({
        model,
        messages,
        temperature,
      });
      console.log(`[AI] Success with model: ${model}`);
      return response.choices[0].message?.content || '{}';
    } catch (error: any) {
      console.warn(`[AI] Model ${model} failed:`, error.message);
      lastError = error;
      // If it's a 403 or 429 quota/rate limit error, continue to next model
      if (error.status === 403 || error.status === 429) {
        continue;
      }
      // If it's another type of error, still try next model just in case, but keep track
    }
  }
  
  throw lastError || new Error('All AI models failed to process the request.');
};

// Helper to extract JSON from markdown or text
const extractJSON = (text: string) => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return JSON.parse(match[1]);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    throw new Error('Failed to parse JSON from AI response');
  }
};

export const generateTrackerSchema = async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;
  const end = aiGenerationDuration.startTimer();

  try {
    const content = await generateWithFallback([
      {
        role: 'system',
        content: `You are an AI assistant for TrackOS. You output only strict JSON. No conversational text.
Your goal is to parse the user's intent into a TrackerDefinition schema.
Fields should be objects with: fieldKey, label, type (text, number, boolean, date, select), required (boolean), and options (string array, only for select).
Output exactly this JSON structure:
{
  "name": "Tracker Name",
  "category": "Category",
  "description": "Short description",
  "fields": [ ... ]
}`
      },
      { role: 'user', content: prompt }
    ], 0.1);

    const schema = extractJSON(content);
    aiGenerationTotal.inc({ status: 'success' });
    end();
    res.json({ success: true, data: schema });

  } catch (error: any) {
    aiGenerationTotal.inc({ status: 'failed' });
    errorCounter.inc({ type: 'ai_generation_error', route: '/api/ai/generate' });
    end();
    console.error('AI Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const generateRoutine = async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;
  const end = aiGenerationDuration.startTimer();

  try {
    const content = await generateWithFallback([
      {
        role: 'system',
        content: `You are an AI assistant for TrackOS. You output only strict JSON. No conversational text.
Your goal is to parse the user's intent into a Workflow Routine schema.
Assume the routine starts at 09:00 if not specified. Calculate logical sequence times in HH:MM (24-hour format).
Output exactly this JSON structure:
{
  "title": "Routine Title",
  "tasks": [
    { "taskName": "Name of task", "estimatedMinutes": 30, "startTime": "09:00", "endTime": "09:30" }
  ]
}`
      },
      { role: 'user', content: prompt }
    ], 0.2);

    console.log('AI Routine Raw:', content);
    const schema = extractJSON(content);
    aiRoutineTotal.inc({ status: 'success' });
    end();
    res.json({ success: true, data: schema });

  } catch (error: any) {
    aiRoutineTotal.inc({ status: 'failed' });
    errorCounter.inc({ type: 'ai_routine_error', route: '/api/ai/routine' });
    end();
    console.error('AI Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const suggestRoutineNextStep = async (req: AuthRequest, res: Response) => {
  const { routineTitle, pendingTasks, contextPrompt } = req.body;

  try {
    const content = await generateWithFallback([
      {
        role: 'system',
        content: `You are an AI productivity coach. The user is executing a routine: "${routineTitle}". 
Here are their pending tasks: ${JSON.stringify(pendingTasks)}.
The user says: "${contextPrompt}".
Give a short, encouraging 1-sentence recommendation on which task they should do next and why.`
      }
    ], 0.7);

    res.json({ success: true, data: { suggestion: content } });

  } catch (error: any) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const chatWithAi = async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  const userId = req.user?._id;

  try {
    // 1. Fetch current routines context for the AI
    const routines = await Routine.find({ ownerId: userId });
    const routineContext = routines.map(r => ({
      id: r._id,
      title: r.title,
      tasks: r.tasks.map(t => ({ name: t.taskName, completed: t.isCompleted }))
    }));

    // 2. Chat with AI and allow function calls
    const systemPrompt = `You are TrackOS Chatbot, an advanced productivity assistant. 
You can view the user's routines: ${JSON.stringify(routineContext)}.
If the user asks to mark a task as done, update a routine, or do a specific action, output a JSON block inside your message like this:
\`\`\`action
{"type": "COMPLETE_TASK", "routineId": "123", "taskName": "Name"}
\`\`\`
Otherwise, just respond conversationally to help them.`;

    const msgs = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const content = await generateWithFallback(msgs, 0.7);

    // 3. Parse and execute action if present
    let executedAction = null;
    const actionMatch = content.match(/```action\n([\s\S]*?)\n```/);
    if (actionMatch && actionMatch[1]) {
      try {
        const action = JSON.parse(actionMatch[1]);
        if (action.type === 'COMPLETE_TASK') {
          const routine = await Routine.findOne({ _id: action.routineId, ownerId: userId });
          if (routine) {
            const task = routine.tasks.find(t => t.taskName.toLowerCase().includes(action.taskName.toLowerCase()));
            if (task) {
              task.isCompleted = true;
              await routine.save();
              executedAction = `Successfully marked "${task.taskName}" as completed!`;
            }
          }
        }
      } catch (e) {
        console.error('Action parse error', e);
      }
    }

    res.json({ success: true, data: { reply: content.replace(/```action\n[\s\S]*?\n```/, '').trim(), executedAction } });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

