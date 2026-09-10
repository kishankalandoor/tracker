import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import {
  getConversations,
  createConversation,
  getMessages,
  sendChatMessage,
  deleteConversation,
} from '../controllers/chatController';

const router = express.Router();

router.get('/conversations', protect, asyncHandler(getConversations));
router.post('/conversations', protect, asyncHandler(createConversation));
router.delete('/conversations/:id', protect, asyncHandler(deleteConversation));
router.get('/conversations/:id/messages', protect, asyncHandler(getMessages));
router.post('/conversations/:id/messages', protect, asyncHandler(sendChatMessage));

export default router;
