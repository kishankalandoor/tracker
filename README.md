<div align="center">

# 🌌 TrackOS (Universal Tracker)
**An AI-Powered Habit, Routine, and Planner Ecosystem**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)

[**Explore Documentation**](#-comprehensive-documentation) • [**Quick Start**](#-quick-start) • [**Architecture**](#-architecture--stack)

</div>

---

## 📖 Overview

**TrackOS** is a comprehensive, AI-native productivity suite designed to adapt to any tracking need. Unlike rigid habit trackers, TrackOS allows users to define custom data schemas on the fly using AI, build complex layered routines, and manage rich-text planners. 

The entire stack is built for production readiness, wrapped in **Docker**, and heavily instrumented with a state-of-the-art **Prometheus, Loki, and Grafana** observability stack.

---

## ✨ Core Features

- 🧠 **AI-Powered Schema Generation**: Describe what you want to track (e.g., "Weightlifting with sets, reps, and RPE") and the AI will instantly generate the database schema and UI components.
- 📋 **Dynamic Routine Builder**: Group multiple trackers into daily, weekly, or contextual routines (e.g., "Morning Routine", "Leg Day").
- 📓 **Smart Planners & Reminders**: A rich-text planning system supporting inline checklists, dynamic task scheduling, and integrated reminders.
- 💬 **Persistent AI Chatbot**: A sticky, context-aware chatbot that understands your tracking history and can generate schemas on demand.
- 📊 **Enterprise Observability**: End-to-end monitoring covering Node.js metrics, HTTP latency, API error rates, AI generation metrics, and centralized Docker logs.
- 📱 **Progressive Web App (PWA)**: Installable, offline-ready, responsive mobile-first UI tailored for all devices.

---

## 📚 Comprehensive Documentation

The `docs/` directory contains in-depth documentation covering every aspect of the system. 

### 🏗 Architecture & Design
- **[System Architecture](docs/ARCHITECTURE.md)**: High-level overview of the MERN architecture, Docker networking, and component boundaries.
- **[Database Schema](docs/DATABASE.md)**: Detailed breakdown of the MongoDB collections (Trackers, Entries, Planners, Routines, etc).
- **[Design Decisions](docs/DECISIONS.md)**: Rationale behind key technical choices (e.g., dynamic vs static schemas, observability stack).
- **[AI Integration](docs/AI_INTEGRATION.md)**: How the OmniRoute/Gemini LLM pipeline is structured for schemas and chat.

### 🚀 Usage & Operations
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Setup, standard practices, and UI/UX conventions.
- **[API Reference](docs/API.md)**: Exhaustive list of REST endpoints and authentication flow.
- **[User Flow](docs/USERFLOW.md)**: The end-to-end journey of a user moving through the application.

### 📈 Monitoring & Deployment
- **[Grafana Observability Stack](docs/GRAFANA.md)**: Guide to the PLG stack (Prometheus, Loki, Grafana), custom dashboards, and metrics.
- **[Docker Deployment](docs/DEPLOYMENT.md)**: Local and production Docker Compose documentation.
- **[AWS EC2 Guide](docs/AWS_EC2_DEPLOYMENT.md)**: Step-by-step instructions for deploying to AWS EC2.

### 📝 Project Scope
- **[Submission Details](docs/SUBMISSION.md)**: Project handover and assignment requirements verification.
- **[MVP Scope](docs/MVP.md)** & **[Current State](docs/CURRENT_STATE.md)**: Roadmap and current implementation status.

---

## 🛠 Architecture & Stack

**Frontend**:
- React 18, Vite, TypeScript
- Zustand (State Management)
- Tailwind-like Utility CSS (Custom `index.css`)
- Lucide React (Icons)
- React Router v6

**Backend**:
- Node.js & Express.js
- TypeScript
- MongoDB & Mongoose
- JSON Web Tokens (JWT Auth)
- Prom-client (Metrics instrumentation)

**Observability & Infrastructure**:
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Prometheus (Time-series metrics)
- Grafana (Dashboards)
- Promtail & Loki (Centralized Logs)

---

## 🚀 Quick Start

Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### 1. Clone the repository
```bash
git clone https://github.com/kishankalandoor/tracker.git
cd tracker
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://db:27017/universal-tracker
JWT_SECRET=your_super_secret_key_123
```

### 3. Spin up the cluster
Build and start the full stack (Frontend, Backend, Database, and 5 Monitoring Services):
```bash
docker compose up -d --build
```

### 4. Access the Application
- **TrackOS Web App**: [http://localhost](http://localhost) (or port `80`)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Grafana Dashboards**: [http://localhost:3000](http://localhost:3000) *(User: `admin`, Pass: `admin`)*

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <i>Built with ❤️ for modern productivity.</i>
</div>
