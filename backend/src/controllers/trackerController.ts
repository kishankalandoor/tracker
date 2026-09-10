import { Request, Response } from 'express';
import { TrackerDefinition } from '../models/TrackerDefinition';
import { TrackerEntry } from '../models/TrackerEntry';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTrackers = async (req: AuthRequest, res: Response) => {
  const trackers = await TrackerDefinition.find({
    $or: [{ ownerId: req.user?._id }, { isTemplate: true }]
  });
  res.json({ success: true, data: trackers });
};

export const createTracker = async (req: AuthRequest, res: Response) => {
  const { name, category, description, fields, isTemplate } = req.body;
  
  const tracker = await TrackerDefinition.create({
    name,
    category,
    description,
    fields,
    ownerId: req.user?._id,
    isTemplate: isTemplate || false
  });

  res.status(201).json({ success: true, data: tracker });
};

export const getTrackerEntries = async (req: AuthRequest, res: Response) => {
  const trackerId = req.params.trackerId as string;
  const entries = await TrackerEntry.find({ trackerId, userId: req.user?._id }).sort({ date: -1 });
  res.json({ success: true, data: entries });
};

export const createTrackerEntry = async (req: AuthRequest, res: Response) => {
  const trackerId = req.params.trackerId as string;
  const { date, data } = req.body;

  const tracker = await TrackerDefinition.findById(trackerId);
  if (!tracker) {
    res.status(404);
    throw new Error('Tracker not found');
  }

  const entry = await TrackerEntry.create({
    trackerId,
    userId: req.user?._id,
    date: date || Date.now(),
    data
  });

  res.status(201).json({ success: true, data: entry });
};

// ──────────────────────────────────────────────
// Template-specific controllers (public browse)
// ──────────────────────────────────────────────

export const getTemplates = async (req: Request, res: Response) => {
  const { category } = req.query;
  const query: Record<string, any> = { isTemplate: true };
  if (category && typeof category === 'string') {
    query.category = category;
  }
  const templates = await TrackerDefinition.find(query).sort({ name: 1 }).lean();
  res.json({ success: true, data: templates });
};

export const getTemplateById = async (req: Request, res: Response) => {
  const template = await TrackerDefinition.findOne({
    _id: req.params.templateId,
    isTemplate: true,
  }).lean();

  if (!template) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Template not found' },
    });
    return;
  }

  res.json({ success: true, data: template });
};

export const downloadTemplate = async (req: AuthRequest, res: Response) => {
  const template = await TrackerDefinition.findOne({
    _id: req.params.templateId,
    isTemplate: true,
  }).lean();

  if (!template) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Template not found' },
    });
    return;
  }

  // Log the download event (could write to a TemplateDownload collection later)
  // For MVP: just return the template data as the "download" payload
  res.json({
    success: true,
    message: 'Template downloaded',
    data: template,
  });
};
