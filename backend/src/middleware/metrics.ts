/**
 * metrics.ts — Prometheus instrumentation for TrackOS backend
 *
 * Exposes:
 *  - Default Node.js metrics (heap, GC, event loop lag)
 *  - HTTP request duration histogram (by method, route, status)
 *  - HTTP request total counter
 *  - Active HTTP requests gauge
 *  - Per-feature custom counters (auth, AI, planner, chatbot, reminders)
 *  - AI generation latency histogram
 *  - Error counter by type
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// ── Shared Registry ──────────────────────────────────────────────────────────
export const register = new Registry();
register.setDefaultLabels({ app: 'trackos', env: process.env.NODE_ENV || 'development' });

// Default Node.js metrics (heap, GC, CPU, event loop)
collectDefaultMetrics({ register });

// ── HTTP Metrics ─────────────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpActiveRequests = new Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  registers: [register],
});

// ── Auth Metrics ─────────────────────────────────────────────────────────────

export const authEvents = new Counter({
  name: 'auth_events_total',
  help: 'Authentication events (register, login, failed)',
  labelNames: ['event'], // register | login_success | login_failed | jwt_invalid
  registers: [register],
});

// ── AI Metrics ───────────────────────────────────────────────────────────────

export const aiGenerationTotal = new Counter({
  name: 'ai_generation_requests_total',
  help: 'Total AI tracker generation requests',
  labelNames: ['status'], // success | failed
  registers: [register],
});

export const aiGenerationDuration = new Histogram({
  name: 'ai_generation_duration_seconds',
  help: 'Duration of AI generation calls to Gemini',
  buckets: [0.5, 1, 2, 3, 5, 8, 12, 20, 30],
  registers: [register],
});

export const aiRoutineTotal = new Counter({
  name: 'ai_routine_requests_total',
  help: 'Total AI routine generation requests',
  labelNames: ['status'],
  registers: [register],
});

// ── Chatbot Metrics ──────────────────────────────────────────────────────────

export const chatbotMessagesTotal = new Counter({
  name: 'chatbot_messages_total',
  help: 'Total chatbot messages sent by users',
  labelNames: ['status'], // success | failed
  registers: [register],
});

export const chatbotResponseDuration = new Histogram({
  name: 'chatbot_response_duration_seconds',
  help: 'Duration of chatbot AI response generation',
  buckets: [0.5, 1, 2, 3, 5, 8, 12, 20],
  registers: [register],
});

// ── Planner Metrics ──────────────────────────────────────────────────────────

export const plannerOperations = new Counter({
  name: 'planner_operations_total',
  help: 'Total planner CRUD operations',
  labelNames: ['operation'], // create | read | update | delete | create_from_template
  registers: [register],
});

export const reminderOperations = new Counter({
  name: 'reminder_operations_total',
  help: 'Total reminder operations',
  labelNames: ['operation'], // create | list | acknowledge
  registers: [register],
});

// ── Template Metrics ─────────────────────────────────────────────────────────

export const templateOperations = new Counter({
  name: 'template_operations_total',
  help: 'Template library operations',
  labelNames: ['operation'], // list | view | download
  registers: [register],
});

// ── Tracker Metrics ──────────────────────────────────────────────────────────

export const trackerOperations = new Counter({
  name: 'tracker_operations_total',
  help: 'Tracker CRUD and entry logging operations',
  labelNames: ['operation'], // create | list | log_entry
  registers: [register],
});

// ── Error Metrics ─────────────────────────────────────────────────────────────

export const errorCounter = new Counter({
  name: 'application_errors_total',
  help: 'Total application errors by type',
  labelNames: ['type', 'route'],
  registers: [register],
});

// ── HTTP Instrumentation Middleware ──────────────────────────────────────────

/**
 * Normalise dynamic Express routes: /api/planners/abc123 → /api/planners/:id
 */
function normaliseRoute(req: Request): string {
  // Use matched route path if Express resolved it
  const matched = (req.route?.path as string | undefined) || req.path;
  // Strip the base from Express mounted routers
  const base = (req.baseUrl || '').replace(/\/$/, '');
  return base + matched;
}

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip the metrics endpoint itself to avoid self-scrape noise
  if (req.path === '/metrics') { next(); return; }

  const start = Date.now();
  httpActiveRequests.inc();

  res.on('finish', () => {
    const durationSec = (Date.now() - start) / 1000;
    const route = normaliseRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestDuration.observe(labels, durationSec);
    httpRequestTotal.inc(labels);
    httpActiveRequests.dec();

    // Count 4xx/5xx as errors
    if (res.statusCode >= 400) {
      errorCounter.inc({ type: res.statusCode >= 500 ? 'server_error' : 'client_error', route });
    }
  });

  next();
};
