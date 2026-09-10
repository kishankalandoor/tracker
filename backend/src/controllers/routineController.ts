import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Routine } from '../models/Routine';

export const getRoutines = async (req: AuthRequest, res: Response) => {
  const routines = await Routine.find({ ownerId: req.user?._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: routines });
};

export const createRoutine = async (req: AuthRequest, res: Response) => {
  const { title, tasks } = req.body;
  const routine = await Routine.create({
    ownerId: req.user?._id,
    title,
    tasks: tasks || []
  });
  res.status(201).json({ success: true, data: routine });
};

export const updateRoutine = async (req: AuthRequest, res: Response) => {
  const routine = await Routine.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user?._id },
    req.body,
    { new: true }
  );
  if (!routine) {
    res.status(404).json({ success: false, message: 'Routine not found' });
    return;
  }
  res.json({ success: true, data: routine });
};

export const deleteRoutine = async (req: AuthRequest, res: Response) => {
  const routine = await Routine.findOneAndDelete({ _id: req.params.id, ownerId: req.user?._id });
  if (!routine) {
    res.status(404).json({ success: false, message: 'Routine not found' });
    return;
  }
  res.json({ success: true, message: 'Routine removed' });
};
