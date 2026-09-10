import { Request, Response } from 'express';
import { Planner } from '../models/Planner';
import { TrackerDefinition } from '../models/TrackerDefinition';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { plannerOperations } from '../middleware/metrics';

export const getPlanners = async (req: AuthRequest, res: Response) => {
  plannerOperations.inc({ operation: 'read' });
  const planners = await Planner.find({ ownerId: req.user?._id })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, data: planners });
};

export const createPlanner = async (req: AuthRequest, res: Response) => {
  const { title, description, emoji, templateId, content } = req.body;

  let initialContent = content || { blocks: [] };
  let resolvedEmoji = emoji || '📋';

  // If creating from a template, pre-fill a starter block with template fields
  if (templateId) {
    const template = await TrackerDefinition.findById(templateId);
    if (template) {
      if (!emoji) {
        // Map category to emoji
        const categoryEmoji: Record<string, string> = {
          Personal: '🌅', Health: '💪', Finance: '💰',
          Work: '💼', Study: '📚', Fitness: '🏃',
        };
        resolvedEmoji = categoryEmoji[template.category] || '📋';
      }

      if (!content || (content.blocks && content.blocks.length === 0)) {
        // Auto-generate starter task block from template fields
        const tasks = template.fields.map((f) => ({
          text: f.label,
          isCompleted: false,
        }));
        initialContent = {
          blocks: [
            {
              id: `block-${Date.now()}`,
              type: 'note',
              data: { content: template.description || `Planner based on: ${template.name}` },
            },
            {
              id: `block-${Date.now() + 1}`,
              type: 'task',
              data: { tasks },
            },
          ],
        };
      }
    }
  }

  const planner = await Planner.create({
    ownerId: req.user?._id,
    templateId: templateId
      ? new mongoose.Types.ObjectId(templateId)
      : undefined,
    title: title || 'Untitled Planner',
    description,
    emoji: resolvedEmoji,
    content: initialContent,
    lastSavedAt: new Date(),
  });

  plannerOperations.inc({ operation: templateId ? 'create_from_template' : 'create' });
  res.status(201).json({ success: true, data: planner });
};

export const getPlanner = async (req: AuthRequest, res: Response) => {
  const planner = await Planner.findOne({
    _id: req.params.id,
    ownerId: req.user?._id,
  });

  if (!planner) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Planner not found' },
    });
    return;
  }

  plannerOperations.inc({ operation: 'read' });
  res.json({ success: true, data: planner });
};

export const updatePlanner = async (req: AuthRequest, res: Response) => {
  const { title, description, emoji, content, reminderAt, reminderNote, isCompleted } = req.body;

  const planner = await Planner.findOne({
    _id: req.params.id,
    ownerId: req.user?._id,
  });

  if (!planner) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Planner not found' },
    });
    return;
  }

  // Partial update — only overwrite defined fields (PATCH semantics via PUT)
  if (title !== undefined) planner.title = title;
  if (description !== undefined) planner.description = description;
  if (emoji !== undefined) planner.emoji = emoji;
  if (content !== undefined) planner.content = content;
  if (reminderAt !== undefined) planner.reminderAt = reminderAt;
  if (reminderNote !== undefined) planner.reminderNote = reminderNote;
  if (isCompleted !== undefined) planner.isCompleted = isCompleted;
  planner.lastSavedAt = new Date();

  await planner.save();
  plannerOperations.inc({ operation: 'update' });
  res.json({ success: true, data: planner });
};

export const deletePlanner = async (req: AuthRequest, res: Response) => {
  const planner = await Planner.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user?._id,
  });

  if (!planner) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Planner not found' },
    });
    return;
  }

  plannerOperations.inc({ operation: 'delete' });
  res.json({ success: true, message: 'Planner deleted' });
};
