import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
export declare const getTrackers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTracker: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTrackerEntries: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTrackerEntry: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=trackerController.d.ts.map