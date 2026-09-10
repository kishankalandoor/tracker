import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import {
  getTrackers,
  createTracker,
  getTrackerEntries,
  createTrackerEntry,
  getTemplates,
  getTemplateById,
  downloadTemplate,
} from '../controllers/trackerController';

const router = express.Router();

// ──────────────────────────────────────────────
// Template endpoints (public GET, protected POST)
// ──────────────────────────────────────────────
router.get('/templates', asyncHandler(getTemplates));
router.get('/templates/:templateId', asyncHandler(getTemplateById));
router.post('/templates/:templateId/download', protect, asyncHandler(downloadTemplate));

// ──────────────────────────────────────────────
// User tracker endpoints (all protected)
// ──────────────────────────────────────────────
router.route('/')
  .get(protect, asyncHandler(getTrackers))
  .post(protect, asyncHandler(createTracker));

router.route('/:trackerId/entries')
  .get(protect, asyncHandler(getTrackerEntries))
  .post(protect, asyncHandler(createTrackerEntry));

export default router;
