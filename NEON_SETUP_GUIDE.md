# Neon Database Setup Guide (Easiest Way!)

Neon is a serverless PostgreSQL database - **no installation required!** Perfect for development and production.

## ✨ Benefits

✅ **No PostgreSQL installation** - Works in the cloud
✅ **Free tier** - 0.5 GB storage, enough for development
✅ **2-minute setup** - Much faster than local PostgreSQL
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Works on any OS** - Windows, Mac, Linux
✅ **Connection pooling** - Built-in performance optimization

---

## Step 1: Create Neon Account (1 minute)

1. Go to: **https://neon.tech**
2. Click **"Sign Up"**
3. Sign up with:
   - GitHub account (easiest), OR
   - Google account, OR
   - Email

No credit card required! ✅

---

## Step 2: Create New Project (1 minute)

1. After login, click **"Create Project"** or **"New Project"**
2. Fill in:
   - **Project name**: `seo-audit-tool` (or any name)
   - **Database name**: `seo_audit_db`
   - **Region**: Choose closest to you (e.g., US East, Europe, Asia)
   - **PostgreSQL version**: 15 or 16 (latest)
3. Click **"Create Project"**

Wait 10-20 seconds for provisioning...

---

## Step 3: Get Connection String

After project is created, you'll see a **connection string** like this:

```
postgresql://username:password@ep-xxxxx.region.aws.neon.tech/seo_audit_db?sslmode=require
```

### Copy Connection Strings

You'll need **2 connection strings**:

1. **Direct connection** (for running migrations)
2. **Pooled connection** (for backend application)

On the Neon dashboard:
- Click **"Connection Details"**
- You'll see both options

**Copy BOTH** - we'll use them soon!

---

## Step 4: Configure Backend Environment

```powershell
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo\backend"

# Create .env file
notepad .env
```

Paste this configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Neon Database Configuration (POOLED CONNECTION)
DATABASE_URL=postgresql://username:password@ep-xxxxx.region.aws.neon.tech/seo_audit_db?sslmode=require

# OR use individual settings (use the POOLED connection details from Neon)
DB_HOST=ep-xxxxx.region.aws.neon.tech
DB_PORT=5432
DB_NAME=seo_audit_db
DB_USER=username
DB_PASSWORD=password
DB_SSL=true

# Redis Configuration (optional - can skip for now)
# REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=development_jwt_secret_key_for_local_testing_change_in_production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Optional: Google PageSpeed API
# GOOGLE_PAGESPEED_API_KEY=your_key_here
```

⚠️ **IMPORTANT**: Replace the connection details with YOUR actual Neon connection string!

**Save and close** the file.

---

## Step 5: Update Backend Database Config

Open `backend/src/config/database.ts` and update it to support `DATABASE_URL`:

```powershell
notepad backend/src/config/database.ts
```

Make sure it looks like this:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export { pool };

export const query = (text: string, params?: any[]) => pool.query(text, params);
```

---

## Step 6: Load Database Schema to Neon

We need to load the schema into Neon. Use the **direct connection string** (not pooled):

```powershell
# Install PostgreSQL client tools (only need psql command)
# Option 1: Install full PostgreSQL (see DATABASE_SETUP_GUIDE.md)
# Option 2: Install only psql client

# Set your DIRECT Neon connection string
$env:DATABASE_URL="postgresql://username:password@ep-xxxxx.region.aws.neon.tech/seo_audit_db?sslmode=require"

# Load main schema
psql $env:DATABASE_URL -f database/schema.sql

# Load migrations
psql $env:DATABASE_URL -f database/migrations/001_comprehensive_audit_features.sql
```

### Alternative: Use Neon SQL Editor (No psql needed!)

1. Go to Neon dashboard
2. Click **"SQL Editor"** in the left menu
3. Copy the entire contents of `database/schema.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Repeat for `database/migrations/001_comprehensive_audit_features.sql`

This method works even if you don't have `psql` installed! ✅

---

## Step 7: Install Backend Dependencies

```powershell
cd backend
npm install
```

Make sure `pg` package is installed (it should be already):
```powershell
npm list pg
# Should show: pg@8.x.x
```

---

## Step 8: Test Connection

```powershell
# In backend directory
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? 'ERROR: ' + err.message : 'SUCCESS: Connected! Time is ' + res.rows[0].now); pool.end(); });"
```

Expected output:
```
SUCCESS: Connected! Time is 2024-11-21...
```

---

## Step 9: Start Backend

```powershell
npm run dev
```

Expected output:
```
✅ Database connected successfully
🚀 Server running on http://localhost:5000
```

---

## Step 10: Start Frontend

```powershell
# New PowerShell window
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo\frontend"
npm run dev
```

Open: **http://localhost:5173**

Register a new account - it will save to Neon! 🎉

---

## Neon Dashboard Features

### View Your Data
1. Go to Neon dashboard
2. Click **"Tables"** to see all tables
3. Click **"SQL Editor"** to run queries
4. Example query:
   ```sql
   SELECT * FROM users;
   SELECT * FROM audits;
   ```

### Monitor Usage
- Click **"Monitoring"** to see:
  - Storage used
  - Active connections
  - Query performance

### Backups
- Neon automatically backs up your data
- Go to **"Backups"** to restore if needed

### Connection Pooling
- **Direct connection**: For migrations, manual queries
- **Pooled connection**: For your application (better performance)
- Always use **pooled** in your `.env` file!

---

## Free Tier Limits

Neon Free Tier includes:
- **0.5 GB storage** (enough for thousands of audits)
- **3 GB data transfer/month**
- **Unlimited databases** in same project
- **Automatic sleep** after inactivity (wakes up instantly)

Perfect for development and small production apps! 🚀

---

## Upgrading to Paid Plan (When Needed)

If you outgrow free tier:
- **Scale plan**: $19/month
  - 10 GB storage
  - No sleep timeout
  - Better performance
- **Business plan**: Custom pricing
  - Unlimited everything

But free tier is fine for starting out!

---

## Troubleshooting

### Error: "connection refused"
- Check your connection string is correct
- Make sure it ends with `?sslmode=require`
- Verify project is not sleeping (go to Neon dashboard)

### Error: "password authentication failed"
- Copy connection string again from Neon
- Make sure you're using the correct credentials

### Error: "database does not exist"
- Create database in Neon dashboard
- Or use the connection string from Step 3

### Error: "SSL required"
- Add to `.env`: `DB_SSL=true`
- Or add `?sslmode=require` to connection string

### Schema not loaded
- Use SQL Editor in Neon dashboard (easiest)
- Or install `psql` and run commands from Step 6

---

## Comparison: Local PostgreSQL vs Neon

| Feature | Local PostgreSQL | Neon |
|---------|-----------------|------|
| Installation | 10+ minutes | None |
| Setup time | 15 minutes | 2 minutes |
| Cost | Free | Free tier available |
| Maintenance | Manual updates | Auto-updated |
| Backup | Manual | Automatic |
| Scaling | Manual | Auto-scales |
| Access from anywhere | No | Yes |
| Good for production | Yes | Yes |

**Neon is perfect for this project!** ✅

---

## Production Deployment with Neon

When deploying to Railway, Render, Vercel, etc.:

1. Create **separate Neon project** for production
2. Use **production connection string** in deployment env vars
3. Load schema to production database
4. Set `NODE_ENV=production`

That's it! No server management needed.

---

## Summary Checklist

- [ ] Neon account created
- [ ] Project created on Neon
- [ ] Connection string copied (pooled version)
- [ ] Backend `.env` configured with Neon connection
- [ ] Database schema loaded (via SQL Editor or psql)
- [ ] Migrations loaded
- [ ] Backend connects successfully
- [ ] Backend starts without errors
- [ ] Frontend can register/login users
- [ ] Data saves to Neon database

Once all checkboxes are ✅, you're ready to go!

---

## Next Steps

1. ✅ Use Neon for development
2. ✅ Build your features
3. ✅ When ready for production:
   - Create production Neon project
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel/Netlify
4. ✅ Scale as you grow!

**No local PostgreSQL installation needed!** 🎉
