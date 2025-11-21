# Database Setup Guide - Step by Step

## Step 1: Install PostgreSQL on Windows

### Download PostgreSQL

1. Go to: https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Download **PostgreSQL 15** or **PostgreSQL 16** (latest stable)
4. Run the installer (`.exe` file)

### Installation Settings

When installing, use these settings:

- **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\15`)
- **Components**: Select all (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
- **Data Directory**: Keep default
- **Password**: Set password to `postgres` (or remember your own)
  - ⚠️ **IMPORTANT**: Write this password down!
- **Port**: Keep default `5432`
- **Locale**: Keep default

Click **Next** → **Next** → **Install**

Wait for installation to complete (2-3 minutes).

## Step 2: Verify PostgreSQL is Running

### Option A: Using Services (Windows)

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Look for **"postgresql-x64-15"** (or similar)
4. Status should be **"Running"**
5. If not running, right-click → **Start**

### Option B: Using Command Line

```powershell
# Open PowerShell as Administrator
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Should show "Running"
```

## Step 3: Add PostgreSQL to PATH (If Needed)

```powershell
# Open PowerShell as Administrator
# Add PostgreSQL to PATH
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)

# Close and reopen PowerShell
```

Test if it works:
```powershell
psql --version
# Should show: psql (PostgreSQL) 15.x
```

## Step 4: Create Database

### Method 1: Using Command Line (Recommended)

```powershell
# Open PowerShell (normal, not admin)
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo"

# Connect to PostgreSQL as superuser
psql -U postgres

# You'll be prompted for password (enter: postgres)
```

Once connected, you'll see: `postgres=#`

Run these commands:

```sql
-- Create the database
CREATE DATABASE seo_audit_db;

-- Verify it was created
\l

-- Exit psql
\q
```

### Method 2: Using pgAdmin 4 (GUI)

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Enter master password if prompted
3. Expand **Servers** → **PostgreSQL 15**
4. Right-click **Databases** → **Create** → **Database**
5. Name: `seo_audit_db`
6. Click **Save**

## Step 5: Load Database Schema

```powershell
# Make sure you're in the seo directory
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo"

# Load the main schema
$env:PGPASSWORD="postgres"
psql -U postgres -d seo_audit_db -f database/schema.sql

# You should see lots of "CREATE TABLE" messages
```

Expected output:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
```

## Step 6: Load Migrations (Comprehensive Audit Features)

```powershell
# Still in the seo directory
$env:PGPASSWORD="postgres"
psql -U postgres -d seo_audit_db -f database/migrations/001_comprehensive_audit_features.sql
```

Expected output:
```
ALTER TABLE
CREATE TABLE
CREATE TABLE
...
```

## Step 7: Verify Database Setup

```powershell
# Connect to database
psql -U postgres -d seo_audit_db

# List all tables
\dt

# You should see:
# users
# audits
# issues
# technical_seo_metrics
# content_quality_metrics
# performance_metrics
# ... and more

# Exit
\q
```

## Step 8: Configure Backend Environment

```powershell
cd backend

# Check if .env exists
Get-Content .env
```

If `.env` doesn't exist or has wrong settings, create it:

```powershell
# Create .env file
@"
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seo_audit_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration (optional for now)
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=development_jwt_secret_key_for_local_testing_only_change_in_prod

# Frontend URL
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding UTF8
```

## Step 9: Test Database Connection

```powershell
# In backend directory
npm install

# Test connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ user: 'postgres', password: 'postgres', host: 'localhost', database: 'seo_audit_db', port: 5432 }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? 'ERROR: ' + err.message : 'SUCCESS: Connected! Time is ' + res.rows[0].now); pool.end(); });"
```

Should show:
```
SUCCESS: Connected! Time is 2024-11-21...
```

## Step 10: Install Redis (Optional but Recommended)

### Option A: WSL + Redis
```powershell
# Install WSL if not already installed
wsl --install

# After restart, open WSL terminal
wsl

# In WSL, install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
redis-server --daemonize yes

# Test Redis
redis-cli ping
# Should return: PONG
```

### Option B: Windows Redis (Unofficial)
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Download `Redis-x64-3.0.504.msi`
3. Install and start Redis service

### Option C: Skip Redis for Now
The backend will work without Redis, but caching won't work.

## Step 11: Start Backend Server

```powershell
cd backend
npm run dev
```

Expected output:
```
✅ Database connected successfully
✅ Redis connected successfully
🚀 Server running on http://localhost:5000
```

## Step 12: Test Backend API

Open new PowerShell window:

```powershell
# Test health endpoint
curl http://localhost:5000/health
```

Should return:
```json
{"status":"success","message":"Server is running","timestamp":"..."}
```

## Step 13: Start Frontend (Normal Mode)

```powershell
# Open another PowerShell window
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo\frontend"
npm run dev
```

Open: http://localhost:5173

Now register a new account and it will save to PostgreSQL! 🎉

---

## Troubleshooting

### Error: "psql: command not found"

Add PostgreSQL to PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### Error: "password authentication failed"

Your password is not `postgres`. Either:
1. Use your actual password
2. Or reset PostgreSQL password

### Error: "database does not exist"

Run Step 4 again to create the database.

### Error: "relation does not exist"

Run Step 5 and 6 again to load schema and migrations.

### Error: "ECONNREFUSED 127.0.0.1:5432"

PostgreSQL is not running:
1. Open Services (`services.msc`)
2. Find "postgresql-x64-15"
3. Right-click → Start

---

## Quick Reference

```powershell
# Start PostgreSQL
Get-Service postgresql* | Start-Service

# Stop PostgreSQL
Get-Service postgresql* | Stop-Service

# Connect to database
psql -U postgres -d seo_audit_db

# List databases
psql -U postgres -c "\l"

# List tables in seo_audit_db
psql -U postgres -d seo_audit_db -c "\dt"

# Backup database
pg_dump -U postgres seo_audit_db > backup.sql

# Restore database
psql -U postgres -d seo_audit_db < backup.sql
```

---

## Summary Checklist

- [ ] PostgreSQL installed
- [ ] PostgreSQL service running
- [ ] Database `seo_audit_db` created
- [ ] Schema loaded (users, audits, issues tables)
- [ ] Migrations loaded (comprehensive audit features)
- [ ] Backend `.env` configured
- [ ] Backend can connect to database
- [ ] Redis installed (optional)
- [ ] Backend server starts without errors
- [ ] Frontend can register/login users

Once all checkboxes are ✅, you have a fully working setup!
