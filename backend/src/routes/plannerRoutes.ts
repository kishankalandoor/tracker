import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import {
  getPlanners,
  createPlanner,
  getPlanner,
  updatePlanner,
  deletePlanner,
} from '../controllers/plannerController';

const router = express.Router();

router.route('/')
  .get(protect, asyncHandler(getPlanners))
  .post(protect, asyncHandler(createPlanner));

router.route('/:id')
  .get(protect, asyncHandler(getPlanner))
  .put(protect, asyncHandler(updatePlanner))
  .delete(protect, asyncHandler(deletePlanner));

export default router;
