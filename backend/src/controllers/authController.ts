import { Request, Response } from 'express';
import { User } from '../models/User';
import generateToken from '../utils/generateToken';
import { authEvents } from '../middleware/metrics';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password, // Pre-save hook hashes it
  });

  if (user) {
    authEvents.inc({ event: 'register' });
    res.status(201).json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    authEvents.inc({ event: 'login_success' });
    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  } else {
    authEvents.inc({ event: 'login_failed' });
    res.status(401);
    throw new Error('Invalid email or password');
  }
};
