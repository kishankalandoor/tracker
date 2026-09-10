import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Conversation } from '../models/Conversation';
import { ChatMessage } from '../models/ChatMessage';
import { Routine } from '../models/Routine';
import OpenAI from 'openai';
import { chatbotMessagesTotal, chatbotResponseDuration, errorCounter } from '../middleware/metrics';

const openai = new OpenAI({
  apiKey: process.env.OMNIROUTE_API_KEY || 'sk-4bgz5xzHe3aHRP0dNIgSWcxQl1u2pvD4ndShdfUVuCIeH2c8',
  baseURL: process.env.OMNIROUTE_BASE_URL || 'http://host.docker.internal:20128/v1',
});

const MODELS_TO_TRY = [
  'agy/claude-sonnet-4-6',
  'agentrouter/claude-opus-5',
  'agentrouter/gpt-5.6-sol',
  'agentrouter/claude-opus-4-8',
  'agentrouter/deepseek-v4-flash',
];

const chatWithFallback = async (messages: any[], temperature = 0.7): Promise<string> => {
  let lastError: any;
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[Chat] Trying model: ${model}`);
      const res = await openai.chat.completions.create({ model, messages, temperature });
      console.log(`[Chat] Success: ${model}`);
      return res.choices[0].message?.content || '';
    } catch (err: any) {
      console.warn(`[Chat] ${model} failed: ${err.message}`);
      lastError = err;
      if (err.status === 403 || err.status === 429) continue;
    }
  }
  throw lastError || new Error('All AI models failed.');
};

// GET /api/chat/conversations
export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const convs = await Conversation.find({ ownerId: userId }).sort({ updatedAt: -1 });
  res.json({ success: true, data: convs });
};

// POST /api/chat/conversations
export const createConversation = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const { title } = req.body;
  const conv = new Conversation({ title: title || 'New Chat', ownerId: userId });
  await conv.save();
  res.json({ success: true, data: conv });
};

// DELETE /api/chat/conversations/:id
export const deleteConversation = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  await Conversation.findOneAndDelete({ _id: req.params.id, ownerId: userId });
  await ChatMessage.deleteMany({ conversationId: req.params.id });
  res.json({ success: true });
};

// GET /api/chat/conversations/:id/messages
export const getMessages = async (req: AuthRequest, res: Response) => {
  const msgs = await ChatMessage.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
  res.json({ success: true, data: msgs });
};

// POST /api/chat/conversations/:id/messages
export const sendChatMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  const { content } = req.body;
  const conversationId = req.params.id;
  const end = chatbotResponseDuration.startTimer();

  // Save user message
  const userMsg = new ChatMessage({ conversationId, role: 'user', content });
  await userMsg.save();

  // Auto-title first message
  const msgCount = await ChatMessage.countDocuments({ conversationId });
  if (msgCount === 1) {
    await Conversation.findByIdAndUpdate(conversationId, {
      title: content.substring(0, 40) + (content.length > 40 ? '...' : ''),
      updatedAt: new Date(),
    });
  } else {
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
  }

  // Fetch recent history for context (last 20 messages)
  const recentHistory = await ChatMessage.find({ conversationId }).sort({ createdAt: -1 }).limit(20);
  const historyMsgs = recentHistory.reverse().slice(0, -1); // exclude just-saved user msg

  // Fetch routines for context
  const routines = await Routine.find({ ownerId: userId });
  const routineContext = routines.map(r => ({
    id: r._id.toString(),
    title: r.title,
    tasks: r.tasks.map(t => ({ name: t.taskName, completed: t.isCompleted })),
  }));

  const systemPrompt = `You are TrackOS AI Assistant — a powerful productivity chatbot similar to ChatGPT.
You have access to the user's routines and workflow data: ${JSON.stringify(routineContext)}.

You can take ACTIONS on the user's data. If the user asks you to mark a task as complete or modify a routine, 
emit an action block at the end of your reply in this exact format:
\`\`\`action
{"type": "COMPLETE_TASK", "routineId": "<id>", "taskName": "<name>"}
\`\`\`

You also generate structured routine plans when asked. Be conversational, helpful, and remember the full history of this conversation.
Current time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`;

  const apiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...historyMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content },
  ];

  const rawReply = await chatWithFallback(apiMessages, 0.7);

  // Parse and execute action if present
  let executedAction: string | undefined;
  const actionMatch = rawReply.match(/```action\n([\s\S]*?)\n```/);
  if (actionMatch?.[1]) {
    try {
      const action = JSON.parse(actionMatch[1]);
      if (action.type === 'COMPLETE_TASK') {
        const routine = await Routine.findOne({ _id: action.routineId, ownerId: userId });
        if (routine) {
          const task = routine.tasks.find(t =>
            t.taskName.toLowerCase().includes(action.taskName.toLowerCase())
          );
          if (task) {
            task.isCompleted = true;
            await routine.save();
            executedAction = `✅ Marked "${task.taskName}" as completed in "${routine.title}"`;
          }
        }
      }
    } catch (e) {
      console.error('Action parse error:', e);
    }
  }

  const cleanReply = rawReply.replace(/```action\n[\s\S]*?\n```/, '').trim();

  // Save assistant message
  const assistantMsg = new ChatMessage({
    conversationId,
    role: 'assistant',
    content: cleanReply,
    executedAction,
  });
  await assistantMsg.save();

  chatbotMessagesTotal.inc({ status: 'success' });
  end();
  res.json({
    success: true,
    data: {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    },
  });
};
