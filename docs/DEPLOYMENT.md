# Production Deployment Guide

This guide covers deploying the SEO Audit Tool to production environments.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ database
- Redis 7+ instance
- Domain name with SSL certificate
- SMTP server for emails (optional)
- Stripe account for payments (optional)

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=seo_audit_prod_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# Redis Configuration
REDIS_URL=redis://your-redis-host:6379

# JWT Secret (MUST be 32+ characters)
JWT_SECRET=your-very-secure-jwt-secret-key-at-least-32-characters

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_AGENCY=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="SEO Audit Tool <noreply@yourdomain.com>"

# External APIs (Optional)
GOOGLE_PAGESPEED_API_KEY=your_api_key
MOZ_ACCESS_ID=your_moz_id
MOZ_SECRET_KEY=your_moz_key

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### Frontend (.env)

```bash
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/yourusername/seo-audit-tool.git
   cd seo-audit-tool
   ```

2. **Create production environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit both files with production values
   ```

3. **Update docker-compose.yml for production**
   ```yaml
   version: '3.8'

   services:
     backend:
       build: ./backend
       restart: always
       ports:
         - "5000:5000"
       environment:
         NODE_ENV: production
       env_file:
         - ./backend/.env
       depends_on:
         - postgres
         - redis
       volumes:
         - ./logs:/app/logs

     frontend:
       build: ./frontend
       restart: always
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/ssl:/etc/nginx/ssl

     postgres:
       image: postgres:15-alpine
       restart: always
       environment:
         POSTGRES_DB: ${DB_NAME}
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

     redis:
       image: redis:7-alpine
       restart: always
       command: redis-server --appendonly yes
       volumes:
         - redis_data:/data

   volumes:
     postgres_data:
     redis_data:
   ```

4. **Start the services**
   ```bash
   docker-compose up -d
   ```

5. **Check logs**
   ```bash
   docker-compose logs -f
   ```

---

### Option 2: AWS EC2 + RDS + ElastiCache

#### EC2 Setup

1. **Launch EC2 instance** (t3.medium or larger)
   - Ubuntu 22.04 LTS
   - Security groups: Allow 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. **Clone and deploy**
   ```bash
   git clone https://github.com/yourusername/seo-audit-tool.git
   cd seo-audit-tool
   # Configure environment variables
   docker-compose up -d
   ```

#### RDS Setup

1. **Create PostgreSQL RDS instance**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (or larger)
   - Storage: 20GB SSD
   - Enable automatic backups

2. **Security group**
   - Allow inbound on port 5432 from EC2 security group

3. **Initialize database**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d seo_audit_db -f database/schema.sql
   ```

#### ElastiCache Setup

1. **Create Redis cluster**
   - Engine: Redis 7.x
   - Node type: cache.t3.micro (or larger)

2. **Update backend .env**
   ```bash
   REDIS_URL=redis://your-elasticache-endpoint:6379
   ```

---

### Option 3: Heroku

#### Backend Deployment

1. **Create Heroku app**
   ```bash
   heroku create seo-audit-backend
   heroku addons:create heroku-postgresql:mini
   heroku addons:create heroku-redis:mini
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set FRONTEND_URL=https://your-frontend.netlify.app
   ```

3. **Deploy**
   ```bash
   cd backend
   git push heroku main
   ```

#### Frontend Deployment (Netlify)

1. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   netlify deploy --prod --dir=dist
   ```

---

### Option 4: DigitalOcean App Platform

1. **Create new app**
   - Connect GitHub repository
   - Select branch: `main`

2. **Configure backend service**
   - Type: Web Service
   - Build command: `npm run build`
   - Run command: `npm run start:prod`
   - Environment variables: Add all from .env.example

3. **Configure frontend service**
   - Type: Static Site
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Add databases**
   - PostgreSQL (Dev Database)
   - Redis (Dev Database)

---

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

### Using Cloudflare

1. Point your domain to Cloudflare nameservers
2. Enable "Full (strict)" SSL/TLS encryption
3. Configure origin certificates
4. Enable "Always Use HTTPS"

---

## Database Migrations

### Running migrations

```bash
# Backup database first
pg_dump -h your-db-host -U your-user -d seo_audit_db > backup_$(date +%Y%m%d).sql

# Run migration
psql -h your-db-host -U your-user -d seo_audit_db -f database/migrations/001_add_new_table.sql
```

### Creating migrations

```bash
# Create new migration file
touch database/migrations/$(date +%Y%m%d%H%M%S)_description.sql
```

---

## Monitoring and Logging

### Application Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# File logs (if enabled)
tail -f logs/error.log
tail -f logs/combined.log
```

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Database connectivity
docker-compose exec backend npm run db:test
```

### Monitoring Tools

1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

2. **DataDog** - APM and metrics
   ```bash
   npm install dd-trace
   ```

3. **New Relic** - Performance monitoring
   ```bash
   npm install newrelic
   ```

---

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Redis backup
docker-compose exec -T redis redis-cli SAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Restore from backup

```bash
# Restore database
cat backup_20250115.sql | docker-compose exec -T postgres psql -U $DB_USER $DB_NAME

# Restore Redis
docker-compose stop redis
cp backup_20250115.rdb /var/lib/redis/dump.rdb
docker-compose start redis
```

---

## Scaling

### Horizontal Scaling

1. **Load Balancer** (AWS ALB, Nginx, HAProxy)
   ```nginx
   upstream backend {
       server backend1:5000;
       server backend2:5000;
       server backend3:5000;
   }
   ```

2. **Database Read Replicas**
   - Configure PostgreSQL streaming replication
   - Route read queries to replicas

3. **Redis Cluster**
   - Use Redis Cluster mode for high availability

### Vertical Scaling

- Increase EC2 instance size
- Upgrade RDS instance class
- Add more CPU/Memory to containers

---

## Security Checklist

- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Environment variables secured (never in git)
- [ ] Database passwords are strong (32+ characters)
- [ ] JWT secret is strong and unique
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Regular security updates applied
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose logs backend

# Check environment
docker-compose exec backend env | grep -E "DB|REDIS|JWT"

# Test database connection
docker-compose exec backend npm run db:test
```

### High CPU usage

```bash
# Check processes
docker stats

# Check slow queries
psql -h localhost -U postgres -d seo_audit_db -c "SELECT * FROM pg_stat_activity;"
```

### Out of memory

```bash
# Increase Docker memory limits
docker-compose.yml:
  services:
    backend:
      deploy:
        resources:
          limits:
            memory: 2G
```

---

## Support

For production support:
- GitHub Issues: https://github.com/yourusername/seo-audit-tool/issues
- Email: support@yourdomain.com
- Documentation: https://docs.yourdomain.com
