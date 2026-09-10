# Deployment Guide — TrackOS

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Docker Desktop | ≥ 4.x | Container runtime |
| Docker Compose | ≥ 2.x | Multi-service orchestration |
| OmniRoute | ≥ 3.8 | AI gateway (local or cloud) |
| Git | Any | Source control |

---

## Local Development (Docker Compose)

### 1. Clone & configure

```bash
git clone <repo-url>
cd universal-tracker
```

### 2. Set environment variables

**Backend** — create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/universal_tracker
JWT_SECRET=change_this_to_a_random_64_char_string_in_production
NODE_ENV=production
OMNIROUTE_API_KEY=sk-your-omniroute-api-key
OMNIROUTE_BASE_URL=http://host.docker.internal:20128/v1
```

**Frontend** — create `web/.env`:
```env
VITE_API_BASE_URL=/api
```

> **Note:** `host.docker.internal` resolves to the host machine from inside Docker containers. This is how the backend container reaches OmniRoute running on `localhost:20128`.

### 3. Start OmniRoute (if local)

```bash
# In a separate terminal
omniroute serve
# Confirm it's running at http://localhost:20128
```

### 4. Build and run

```bash
docker compose up -d --build
```

### 5. Verify

```bash
docker compose ps
# All 3 containers should show "running" or "healthy"

curl http://127.0.0.1/health
# {"status":"ok"}
```

Open browser → **http://127.0.0.1**

---

## Service URLs (Local)

| Service | URL | Notes |
|---|---|---|
| Web App | http://127.0.0.1 | React SPA via Nginx |
| API | http://127.0.0.1/api | Proxied by Nginx |
| MongoDB | mongodb://127.0.0.1:27017 | For local DB tools (Compass) |
| OmniRoute | http://localhost:20128 | Host machine, not Docker |

---

## Production Deployment — AWS EC2

### Infrastructure

```
Internet
    |
    v
Route 53 (DNS)  -->  EC2 Instance (t3.medium recommended)
                          |
                     Docker Compose
                          |
                    ┌─────┴──────────────┐
                    |                    |
               Nginx :80/:443       MongoDB :27017 (internal only)
               Backend API :5000    (named volume for persistence)
```

### Step 1: Launch EC2

- **AMI:** Amazon Linux 2023 or Ubuntu 22.04 LTS
- **Instance type:** t3.medium (2 vCPU, 4GB RAM) minimum
- **Storage:** 20GB gp3
- **Security Group:**
  - Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - All other ports: CLOSED

### Step 2: Install Docker

```bash
# Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### Step 3: Clone and configure

```bash
git clone <repo-url>
cd universal-tracker
```

Edit `backend/.env` with production values:
```env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/universal_tracker
JWT_SECRET=<64-char-random-string>   # openssl rand -hex 32
NODE_ENV=production
OMNIROUTE_API_KEY=<your-key>
OMNIROUTE_BASE_URL=https://your-omniroute-cloud-endpoint/v1
```

### Step 4: Add HTTPS (Let's Encrypt)

Edit `docker-compose.yml` to expose port 443 and add Certbot, or use a load balancer:

```bash
# Simpler: Use AWS Application Load Balancer (ALB) for SSL termination
# ALB --> HTTP to EC2 :80 (internal)
# Certificate managed by AWS ACM (free)
```

### Step 5: Deploy

```bash
docker compose up -d --build
```

### Step 6: Persist across reboots

```bash
# Create systemd service
sudo nano /etc/systemd/system/trackos.service
```

```ini
[Unit]
Description=TrackOS Docker Compose App
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/home/ec2-user/universal-tracker
ExecStart=/usr/local/lib/docker/cli-plugins/docker-compose up
ExecStop=/usr/local/lib/docker/cli-plugins/docker-compose down
Restart=always
User=ec2-user

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable trackos
sudo systemctl start trackos
```

---

## Updating the Application

```bash
cd universal-tracker
git pull origin main
docker compose up -d --build
# Zero-downtime: old container replaced with new build
```

---

## Backup MongoDB Data

```bash
# Dump
docker exec universal_tracker_db mongodump \
  --db universal_tracker \
  --out /data/db/backup/$(date +%Y-%m-%d)

# Copy to host
docker cp universal_tracker_db:/data/db/backup ./backups/

# Restore
docker exec universal_tracker_db mongorestore \
  --db universal_tracker ./backups/2026-09-09/universal_tracker
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | | `5000` | API server port |
| `MONGODB_URI` | ✓ | | Full MongoDB connection string |
| `JWT_SECRET` | ✓ | | Secret for signing JWTs — use 32+ char random string |
| `NODE_ENV` | | `development` | `production` disables verbose errors |
| `OMNIROUTE_API_KEY` | ✓ | | OmniRoute API key |
| `OMNIROUTE_BASE_URL` | ✓ | | OmniRoute base URL (ends in `/v1`) |

### Frontend (build-time)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base path for all API calls |

---

## Health Checks

| Endpoint | Expected |
|---|---|
| `GET /health` | `{"status":"ok"}` |
| `GET /api/auth/login` (POST only) | `405 Method Not Allowed` |
| MongoDB ping | `docker exec universal_tracker_db mongosh --eval 'db.runCommand("ping")'` |

---

## Logs

```bash
# All services
docker compose logs -f

# Just backend
docker compose logs -f backend

# Just frontend/nginx
docker compose logs -f frontend
```
