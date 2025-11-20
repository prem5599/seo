# Enabling Virtualization for Docker

## Check if Virtualization is Supported

### Windows:
1. Open Task Manager (Ctrl + Shift + Esc)
2. Go to **Performance** tab
3. Click **CPU**
4. Look for "Virtualization: Enabled" or "Virtualization: Disabled"

### If it says "Disabled":

#### For Intel CPUs:
1. Restart your computer
2. Press **F2**, **F10**, **Del**, or **Esc** during boot (depends on manufacturer)
3. Navigate to **Advanced** or **CPU Configuration**
4. Find **Intel VT-x** or **Virtualization Technology**
5. Set it to **Enabled**
6. Save and exit (usually F10)

#### For AMD CPUs:
1. Restart your computer
2. Enter BIOS (F2, F10, Del, or Esc)
3. Navigate to **Advanced** or **CPU Configuration**
4. Find **SVM Mode** or **AMD-V**
5. Set it to **Enabled**
6. Save and exit

### If it says "Not Supported":
Your CPU doesn't support virtualization. See alternative options below.

---

## Alternative: Use Docker Without Desktop (WSL2 on Windows)

If you're on Windows 10/11, you can use Docker with WSL2:

```bash
# Install WSL2
wsl --install

# Install Docker in WSL2 (no Desktop needed)
# Follow: https://docs.docker.com/engine/install/ubuntu/
```

---

## Alternative: Develop Without Docker Locally

You don't need Docker on your local machine for development!

### Local Development Setup (No Docker)

#### 1. Install PostgreSQL
- **Windows**: https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt install postgresql`

#### 2. Install Redis
- **Windows**: https://github.com/microsoftarchive/redis/releases
- **Mac**: `brew install redis`
- **Linux**: `sudo apt install redis-server`

#### 3. Setup Database
```bash
# Create database
psql -U postgres
CREATE DATABASE seo_audit_db;
\q

# Run migrations
psql -U postgres -d seo_audit_db -f database/schema.sql
psql -U postgres -d seo_audit_db -f database/migrations/001_comprehensive_audit_features.sql
```

#### 4. Install Dependencies
```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edit with your local database credentials

# Frontend
cd frontend
npm install
```

#### 5. Run Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## For Production: Use Docker on Cloud (No Local Docker Needed!)

You can develop locally without Docker and deploy with Docker on cloud servers:

### Option 1: Railway.app (Easiest)
- No Docker Desktop needed on your machine
- They handle Docker containers for you
- Free tier available
- Just push your code with `git push`

### Option 2: Render.com
- Similar to Railway
- Free PostgreSQL and Redis
- Auto-deploys from GitHub

### Option 3: DigitalOcean App Platform
- Handles Docker automatically
- Just connect your GitHub repo
- They build and run containers

### Option 4: AWS/Google Cloud with GitHub Actions
- Use GitHub Actions CI/CD to build Docker images
- Deploy to cloud without Docker on your machine
- Cloud servers have virtualization enabled

---

## Recommended Approach for You

**For Development:** No Docker needed
- Install PostgreSQL + Redis locally
- Run `npm run dev` for both backend and frontend
- Faster iteration, simpler debugging

**For Production:** Use cloud platform with Docker
- Railway, Render, or DigitalOcean
- They handle Docker containerization
- You never need Docker Desktop on your machine!

---

## Quick Start (No Docker)

```bash
# 1. Install PostgreSQL and Redis on your system
# 2. Create database
createdb seo_audit_db

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with: DB_HOST=localhost, DB_PORT=5432, etc.
psql -d seo_audit_db -f ../database/schema.sql
npm run dev

# 4. Setup frontend (in new terminal)
cd frontend
npm install
npm run dev

# Done! No Docker needed for development
```

Your app will run at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
