import express from 'express';
import asyncHandler from 'express-async-handler';
import { registerUser, loginUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));

export default router;
