import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import { getRoutines, createRoutine, updateRoutine, deleteRoutine } from '../controllers/routineController';

const router = express.Router();

router.route('/')
  .get(protect, asyncHandler(getRoutines))
  .post(protect, asyncHandler(createRoutine));

router.route('/:id')
  .put(protect, asyncHandler(updateRoutine))
  .delete(protect, asyncHandler(deleteRoutine));

export default router;
