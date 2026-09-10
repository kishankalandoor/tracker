import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import {
  getReminders,
  createReminder,
  ackReminder,
} from '../controllers/reminderController';

const router = express.Router();

router.route('/')
  .get(protect, asyncHandler(getReminders))
  .post(protect, asyncHandler(createReminder));

router.route('/:id/ack')
  .put(protect, asyncHandler(ackReminder));

export default router;
