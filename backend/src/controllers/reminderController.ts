import { Response } from 'express';
import { Reminder } from '../models/Reminder';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { reminderOperations } from '../middleware/metrics';

export const getReminders = async (req: AuthRequest, res: Response) => {
  // Return upcoming (future + within 24h past) unacknowledged reminders
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reminders = await Reminder.find({
    ownerId: req.user?._id,
    isAcknowledged: false,
    reminderAt: { $gte: since },
  }).sort({ reminderAt: 1 });

  res.json({ success: true, data: reminders });
  reminderOperations.inc({ operation: 'list' });
};

export const createReminder = async (req: AuthRequest, res: Response) => {
  const { plannerId, title, reminderAt } = req.body;

  if (!title || !reminderAt) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'title and reminderAt are required' },
    });
    return;
  }

  const reminder = await Reminder.create({
    ownerId: req.user?._id,
    plannerId: plannerId
      ? new mongoose.Types.ObjectId(plannerId)
      : undefined,
    title,
    reminderAt: new Date(reminderAt),
  });

  reminderOperations.inc({ operation: 'create' });
  res.status(201).json({ success: true, data: reminder });
};

export const ackReminder = async (req: AuthRequest, res: Response) => {
  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user?._id },
    { isAcknowledged: true },
    { new: true }
  );

  if (!reminder) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reminder not found' },
    });
    return;
  }

  reminderOperations.inc({ operation: 'acknowledge' });
  res.json({ success: true, data: reminder });
};
