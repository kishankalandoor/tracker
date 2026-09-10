# Developer Guide — TrackOS

---

## Local Development (without Docker)

For faster iteration during development, you can run the backend and frontend directly without rebuilding Docker images.

### Prerequisites

```bash
node --version   # >= 18
npm --version    # >= 9
mongod --version # >= 6 (or use MongoDB Atlas free tier)
```

### Backend (Express API)

```bash
cd backend
cp .env.example .env  # fill in values
npm install
npm run dev           # ts-node-dev with hot reload, port 5000
```

**`.env.example`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/universal_tracker
JWT_SECRET=dev_secret_change_me
NODE_ENV=development
OMNIROUTE_API_KEY=sk-your-key
OMNIROUTE_BASE_URL=http://localhost:20128/v1
```

### Frontend (Vite React)

```bash
cd web
cp .env.example .env
npm install
npm run dev    # Vite dev server, port 5173 with HMR
```

**`.env.example`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> In dev mode, requests go directly to `localhost:5000` — no Nginx proxy.

---

## Project Scripts

### Backend

| Script | Command | Description |
|---|---|---|
| `dev` | `ts-node-dev src/index.ts` | Hot-reload development server |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled production build |
| `seed` | `ts-node src/seed.ts` | Seed sample tracker templates |

### Frontend

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Hot-reload dev server on :5173 |
| `build` | `tsc -b && vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build locally |

---

## Code Structure Guide

### Adding a New Backend Feature

1. **Model** — add schema in `src/models/MyModel.ts`
2. **Controller** — add handler functions in `src/controllers/myController.ts`
3. **Routes** — create `src/routes/myRoutes.ts`, register in `src/index.ts`
4. **Auth** — wrap with `protect` middleware for authenticated routes

```typescript
// src/routes/myRoutes.ts
import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware';
import { getMyData, createMyData } from '../controllers/myController';

const router = express.Router();
router.get('/', protect, asyncHandler(getMyData));
router.post('/', protect, asyncHandler(createMyData));
export default router;
```

### Adding a New Frontend Page

1. Create `src/pages/MyPage.tsx` + `src/pages/MyPage.css`
2. Register route in `src/App.tsx`
3. Add nav link in existing sidebars (Dashboard, Routines, Chatbot)

```tsx
// src/App.tsx
import { MyPage } from './pages/MyPage';
// ...
<Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

---

## Authentication Flow

```
1. User submits login form
         |
         v
POST /api/auth/login
  - Verify email exists
  - bcrypt.compare(password, hash)
  - Sign JWT: { id, name, email }, expires 30d
  - Return { _id, name, email, token }
         |
         v
authStore.ts (Zustand + localStorage)
  - Stores token and user object
  - Auto-attached to every API request via Axios interceptor
         |
         v
ProtectedRoute.tsx
  - Checks authStore for token
  - Redirects to /login if missing
```

---

## API Client (Axios)

All API calls go through a single configured Axios instance:

```typescript
// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

Usage:
```typescript
// In any component
import api from '../services/api';

const res = await api.get('/routines');
const res = await api.post('/routines', { title, tasks });
```

---

## Theming System

The global theme is applied via a CSS attribute on `document.body`:

```typescript
// src/utils/theme.ts
export function applyTheme(theme: 'dark' | 'light') {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('trackos-theme', theme);
}
```

CSS responds via:
```css
/* index.css */
:root { --page-bg: #0d0d0d; /* dark defaults */ }
body[data-theme="light"] { --page-bg: #f7f7f8; /* overrides */ }
```

All pages use `var(--page-bg)`, `var(--text-color)`, `var(--panel-bg)` etc. — never hardcoded hex in page CSS files.

---

## Docker Build Process

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
RUN npm run build        # tsc compiles to dist/
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile (multi-stage)
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build        # Vite outputs to dist/

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx Config
Nginx serves static files and proxies `/api/` to the backend container:
```nginx
location /api/ {
  proxy_pass http://backend:5000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Common Issues & Fixes

### "AI failed to generate" error
- Check OmniRoute is running: `curl http://localhost:20128/health`
- Verify API key in `backend/.env`
- Check OmniRoute dashboard for quota/quota reset time

### MongoDB connection refused
- In Docker: ensure `universal_tracker_db` container is healthy
- Direct: ensure `mongod` is running locally

### JWT token expired
- Clear localStorage in browser DevTools → Application → Local Storage
- Login again

### Build fails with TypeScript errors
- Check for unused imports (TS6133) — remove them
- Run `npm run build` locally to see full error list before Docker build

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_BASE_URL` points to running backend
- Ensure backend `/health` endpoint responds
