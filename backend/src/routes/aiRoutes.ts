import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import { generateTrackerSchema, generateRoutine, suggestRoutineNextStep, chatWithAi } from '../controllers/aiController';

const router = express.Router();

router.post('/generate', protect, asyncHandler(generateTrackerSchema));
router.post('/routine/generate', protect, asyncHandler(generateRoutine));
router.post('/routine/suggest', protect, asyncHandler(suggestRoutineNextStep));
router.post('/chat', protect, asyncHandler(chatWithAi));

export default router;
