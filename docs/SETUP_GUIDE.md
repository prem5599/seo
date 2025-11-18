# Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v15 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v7 or higher) - [Download](https://redis.io/download/)
- **Docker Desktop** (optional) - [Download](https://www.docker.com/products/docker-desktop/)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd seo
```

### 2. Setup PostgreSQL Database

#### Option A: Using Docker
```bash
docker run --name seo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=seo_audit_db -p 5432:5432 -d postgres:15-alpine
```

#### Option B: Using Local PostgreSQL
```bash
# Create database
createdb seo_audit_db

# Run schema migration
psql -d seo_audit_db -f database/schema.sql

# (Optional) Load seed data for testing
psql -d seo_audit_db -f database/seed.sql
```

### 3. Setup Redis

#### Option A: Using Docker
```bash
docker run --name seo-redis -p 6379:6379 -d redis:7-alpine
```

#### Option B: Using Local Redis
```bash
# On macOS
brew services start redis

# On Ubuntu
sudo systemctl start redis-server

# On Windows
# Download and run from https://github.com/microsoftarchive/redis/releases
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

**Important .env variables to configure:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seo_audit_db
DB_USER=postgres
DB_PASSWORD=your_password_here

REDIS_URL=redis://localhost:6379

JWT_SECRET=your_super_secret_key_minimum_32_characters

FRONTEND_URL=http://localhost:5173
```

```bash
# Start the backend server
npm run dev
```

The backend should now be running on http://localhost:5000

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Frontend .env configuration:**
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# Start the frontend development server
npm run dev
```

The frontend should now be running on http://localhost:5173

### 6. Create Your First User

1. Open http://localhost:5173 in your browser
2. Click "Sign Up"
3. Enter your email and password
4. You'll be automatically logged in and redirected to the dashboard

### 7. Run Your First Audit

1. On the dashboard, enter a website URL (e.g., https://example.com)
2. Click "Audit Site"
3. Wait 2-5 minutes for the crawl to complete
4. View your results!

## Docker Setup (Alternative)

If you prefer to use Docker for the entire stack:

```bash
# Make sure Docker Desktop is running

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

Access the application:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Troubleshooting

### Backend won't start

**Error: "Cannot connect to database"**
- Ensure PostgreSQL is running: `psql -U postgres`
- Check your .env DB credentials
- Verify the database exists: `\l` in psql

**Error: "Redis connection failed"**
- Check if Redis is running: `redis-cli ping` (should return "PONG")
- Verify REDIS_URL in .env

### Frontend issues

**Error: "Network Error" when creating audit**
- Check if backend is running on port 5000
- Verify VITE_API_URL in frontend/.env
- Check browser console for CORS errors

**Login not working**
- Clear localStorage: Open DevTools → Application → Local Storage → Clear
- Check backend logs for errors

### Puppeteer issues

**Error: "Failed to launch Chrome"**
- On Linux, install required dependencies:
  ```bash
  sudo apt-get install -y chromium-browser
  ```
- Set environment variable:
  ```bash
  export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
  ```

### Database migrations

If you need to reset the database:
```bash
# Drop and recreate database
dropdb seo_audit_db
createdb seo_audit_db
psql -d seo_audit_db -f database/schema.sql
```

## Production Deployment

### Environment Variables

**Backend Production .env:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PASSWORD=strong_password_here
JWT_SECRET=your_very_long_random_secret_key
FRONTEND_URL=https://your-domain.com
```

**Frontend Production .env:**
```env
VITE_API_URL=https://api.your-domain.com/api
```

### Build Commands

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Deploy the dist/ folder to Netlify/Vercel/S3
```

## Common Commands

### Backend
```bash
npm run dev          # Development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start built app
npm run start:prod   # Start in production mode
npm run clean        # Remove dist folder
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database
```bash
# Backup database
pg_dump seo_audit_db > backup.sql

# Restore database
psql seo_audit_db < backup.sql

# Check database connection
psql -h localhost -U postgres -d seo_audit_db
```

## Next Steps

1. Review the [API Documentation](API.md)
2. Read the [Business Plan](../SEO-Audit-Tool-SaaS-Guide.md)
3. Customize the branding and styling
4. Set up payment processing (Stripe)
5. Configure email notifications
6. Set up monitoring and logging
7. Deploy to production!

## Support

If you encounter any issues:
1. Check the logs: `docker-compose logs backend` or terminal output
2. Review the troubleshooting section above
3. Check PostgreSQL and Redis are running
4. Ensure all environment variables are set correctly
5. Try restarting all services

Happy auditing! 🚀
