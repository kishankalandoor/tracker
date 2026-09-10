# TrackOS — Observability & Monitoring (Grafana Stack)

This document describes the full observability stack integrated into TrackOS, built entirely with the Prometheus + Loki + Grafana (PLG) stack.

---

## 🏗️ Architecture

The monitoring stack consists of five new Docker containers alongside the main TrackOS application:

1. **Prometheus (`universal_tracker_prometheus`)**: Time-series database that scrapes metrics from the backend and Nginx.
2. **Promtail (`universal_tracker_promtail`)**: Agent that tails Docker container logs, parses them, and pushes them to Loki.
3. **Loki (`universal_tracker_loki`)**: Log aggregation system (like Prometheus, but for logs).
4. **Nginx Exporter (`universal_tracker_nginx_exporter`)**: Scrapes the Nginx `/stub_status` endpoint to provide connection and request metrics to Prometheus.
5. **Grafana (`universal_tracker_grafana`)**: The visualization layer, auto-provisioned with 6 custom dashboards.

---

## 🚀 Accessing Grafana

- **URL**: [http://localhost:3000](http://localhost:3000)
- **Username**: `admin`
- **Password**: `admin`

Datasources (Prometheus & Loki) and all dashboards are **automatically provisioned** on startup. You do not need to manually configure them.

---

## 📊 Dashboards Included

Go to **Dashboards > TrackOS Dashboards** in Grafana to see the following:

### 1. TrackOS — Overview (`01-overview.json`)
The high-level health of the application.
- Global Request Rate & Error Rate (5xx)
- P95 Latency
- Node.js Health (Heap usage, GC times, Event Loop Lag)
- Active Connections

### 2. TrackOS — API Performance (`02-api-performance.json`)
Deep dive into HTTP routing.
- Filterable by `Route` and `Method` variables.
- Request volume, P95 latency, and error rates **per individual route**.
- Table of the slowest routes for performance hunting.

### 3. TrackOS — AI & Chatbot (`03-ai-chatbot.json`)
Specific metrics for Gemini LLM usage.
- Total schemas generated, total routines generated, chatbot messages sent.
- **AI Latency**: P50/P95 response times from the AI provider.
- AI Success vs Failure Rate (tracks API timeouts or parsing errors).
- Direct Loki log panel showing `[AI]`, `[Chat]`, and `[Routine]` tagged events.

### 4. TrackOS — Auth & Planners (`04-auth-planners.json`)
Business metrics and user activity.
- Registration count, successful logins, failed logins.
- Planner operations (Creates, Updates, Deletes, Create-from-Template).
- Reminder operations (Create, List, Ack).

### 5. TrackOS — Log Explorer (`05-loki-logs.json`)
Centralized logging interface.
- Dropdowns to filter by `Service` (frontend, backend, db) and `Log Level`.
- Time-series graph of log volume.
- Searchable, descending log stream directly parsed from Docker containers.

### 6. TrackOS — Frontend & Nginx (`06-frontend-nginx.json`)
Traffic hitting the reverse proxy.
- Nginx Active Connections (Reading, Writing, Waiting).
- Requests per second.
- Nginx Error rates (parsed dynamically from Nginx error logs).
- Raw frontend access logs.

---

## 🛠️ How It Works (Instrumentation)

### Backend Metrics (`prom-client`)
The Express backend is instrumented using `prom-client` in `backend/src/middleware/metrics.ts`.
- **Middleware**: Intercepts every HTTP request to record duration and status.
- **Custom Counters**: Controllers (`authController`, `aiController`, `plannerController`) manually call `.inc()` on custom counters (e.g., `authEvents`, `plannerOperations`).
- **Endpoint**: Exposes `http://backend:5000/metrics` which Prometheus scrapes every 10 seconds.

### Frontend Logs (`promtail`)
Promtail mounts the host's `/var/run/docker.sock` and `/var/log` to dynamically discover containers. It filters for `universal_tracker_*` containers, extracts JSON logs from Node, and parses Nginx combined access logs to attach `status`, `method`, and `error` labels in Loki.

### Nginx Metrics (`stub_status`)
The `web/nginx.conf` exposes a `/stub_status` route. The `nginx-exporter` container hits this route and translates it into Prometheus format.

---

## 🔄 Adding New Metrics

To add a new metric:
1. Define the metric in `backend/src/middleware/metrics.ts`.
2. Import and increment it in your controller.
3. Edit the relevant JSON dashboard in `monitoring/grafana/dashboards/` (or use the Grafana UI, save the JSON, and commit it).
