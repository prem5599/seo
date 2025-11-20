# Deployment Guide (No Docker)

This guide shows how to deploy the SEO Audit SaaS without Docker.

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Setup Steps

1. **Install PostgreSQL and Redis**
   - Windows: Download from official websites
   - macOS: `brew install postgresql redis`
   - Linux: `sudo apt install postgresql redis-server`

2. **Create Database**
   ```bash
   createdb seo_audit_db
   psql -d seo_audit_db -f database/schema.sql
   psql -d seo_audit_db -f database/migrations/001_comprehensive_audit_features.sql
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your local credentials
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Production Deployment Options

### Option 1: Railway.app (Recommended - Easiest)

1. **Push code to GitHub**
2. **Go to Railway.app** and connect your repo
3. **Add services**:
   - Backend (Node.js)
   - Frontend (Node.js)
   - PostgreSQL (from Railway)
   - Redis (from Railway)
4. **Set environment variables** in Railway dashboard
5. **Deploy** - Railway handles everything automatically

### Option 2: Render.com

1. **Create services** on Render:
   - Web Service for backend
   - Static Site for frontend
   - PostgreSQL database
   - Redis instance
2. **Connect GitHub repo**
3. **Configure environment variables**
4. **Deploy**

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **Setup server**
   ```bash
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs

   # Install PostgreSQL
   sudo apt install postgresql

   # Install Redis
   sudo apt install redis-server

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd seo

   # Backend
   cd backend
   npm install
   npm run build

   # Frontend
   cd ../frontend
   npm install
   npm run build
   ```

3. **Setup database**
   ```bash
   sudo -u postgres createdb seo_audit_db
   sudo -u postgres psql -d seo_audit_db -f database/schema.sql
   sudo -u postgres psql -d seo_audit_db -f database/migrations/001_comprehensive_audit_features.sql
   ```

4. **Configure environment**
   ```bash
   cd backend
   nano .env
   # Add production credentials
   ```

5. **Start with PM2**
   ```bash
   # Backend
   cd backend
   pm2 start dist/server.js --name seo-backend

   # Frontend (serve with nginx)
   sudo apt install nginx
   sudo cp -r frontend/dist/* /var/www/html/
   ```

6. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /var/www/html;
           try_files $uri /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable auto-restart**
   ```bash
   pm2 startup
   pm2 save
   ```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seo_audit_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=https://yourdomain.com
GOOGLE_PAGESPEED_API_KEY=optional
STRIPE_SECRET_KEY=optional
```

### Frontend (.env)
```
VITE_API_URL=https://api.yourdomain.com
```

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs seo-backend
pm2 status
```

### Database Backups
```bash
# Create backup script
pg_dump seo_audit_db > backup-$(date +%Y%m%d).sql

# Add to crontab for daily backups
crontab -e
0 2 * * * pg_dump seo_audit_db > /backups/seo-$(date +\%Y\%m\%d).sql
```

## Performance Tips

1. **Use a CDN** for frontend assets (Cloudflare)
2. **Enable Redis caching** for frequently accessed data
3. **Setup database indexes** for faster queries
4. **Use PM2 cluster mode** for better performance:
   ```bash
   pm2 start dist/server.js -i max --name seo-backend
   ```

## Troubleshooting

**Database connection fails:**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in .env file
- Check firewall rules

**Redis connection fails:**
- Check Redis is running: `sudo systemctl status redis`
- Verify REDIS_URL in .env

**Frontend can't reach backend:**
- Check VITE_API_URL is correct
- Verify CORS settings in backend
- Check nginx proxy configuration

## Recommended: Railway.app

For the easiest deployment experience:
1. Push to GitHub
2. Connect Railway.app to your repo
3. Add PostgreSQL and Redis from Railway templates
4. Set environment variables
5. Deploy!

Railway handles SSL, scaling, and monitoring automatically.
