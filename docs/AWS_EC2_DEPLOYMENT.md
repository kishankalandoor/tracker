# AWS EC2 Deployment Guide

This guide covers the professional end-to-end deployment of the Universal Tracker Platform (TrackOS) on an AWS EC2 instance. The architecture leverages Docker Compose for containerized deployment, ensuring a reliable, isolated, and scalable environment.

## 1. Prerequisites
- An active AWS Account.
- A registered Domain Name (optional but recommended for SSL).
- SSH key pair created in AWS (e.g., `trackos-key.pem`).

## 2. Provisioning the EC2 Instance

1. Navigate to the **EC2 Dashboard** in your AWS Console.
2. Click **Launch Instance**.
3. **Name**: `trackos-production`
4. **AMI**: Ubuntu 24.04 LTS (or 22.04 LTS).
5. **Instance Type**: `t3.small` (Minimum recommended for Node.js + MongoDB + React).
6. **Key Pair**: Select your `trackos-key.pem`.
7. **Network Settings**:
   - Auto-assign Public IP: Enable.
   - Create a New Security Group with the following Inbound Rules:
     - SSH (Port 22) from your IP.
     - HTTP (Port 80) from Anywhere.
     - HTTPS (Port 443) from Anywhere.
8. **Storage**: Minimum 20 GB gp3.
9. Click **Launch**.

## 3. Server Initialization & Software Installation

Connect to your EC2 instance:
```bash
ssh -i /path/to/trackos-key.pem ubuntu@<your-ec2-public-ip>
```

Install required dependencies (Docker and Git):
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin -y

# Add ubuntu user to docker group (so you don't need sudo for docker)
sudo usermod -aG docker ubuntu
```
*Note: Log out and log back in for the group changes to take effect.*

## 4. Deploying the Application

1. Clone the repository onto the server:
   ```bash
   git clone <your-repository-url> universal-tracker
   cd universal-tracker
   ```

2. Set up the production environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to set `NODE_ENV=production` and update `JWT_SECRET` to a strong random string.

3. Boot the application using Docker Compose:
   ```bash
   docker compose up -d --build
   ```

## 5. Setting up SSL/TLS (HTTPS) using Certbot

To secure the application with HTTPS, we can set up an Nginx reverse proxy on the host, or map the Let's Encrypt certificates into our containerized Nginx. A professional standard approach is to install Nginx and Certbot directly on the host to terminate SSL, and proxy to the Docker container.

### Step 5.1: Modify Docker Compose
In your `docker-compose.yml`, change the frontend port binding to bind to localhost only so it's not exposed publicly over raw HTTP:
```yaml
    ports:
      - "127.0.0.1:8080:80"
```
Recreate the container: `docker compose up -d`

### Step 5.2: Install Certbot & Nginx on Host
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 5.3: Host Nginx Configuration
Create a new file `/etc/nginx/sites-available/trackos`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and obtain the SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/trackos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 6. OmniRoute Integration
If you intend to host the OmniRoute local LLM router on this same EC2 instance, ensure:
1. The OmniRoute daemon is running on the host.
2. The `host.docker.internal` routing in the containerized Nginx configuration will successfully proxy `/v1` and `/home` requests to the host machine port `20128`.
3. If OmniRoute is strictly local to the server, ensure Port 20128 is blocked in the EC2 Security Group so the public can only access it securely through your Nginx reverse proxy via port 80/443.

## 7. Ongoing Maintenance
- **Updating the app**: `git pull origin main && docker compose up -d --build`
- **Checking Logs**: `docker compose logs -f`
- **Database Backups**: Use `mongodump` periodically, targeting the `mongodb` container, and sync backups to AWS S3.
