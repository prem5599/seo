# Frontend Standalone Mode

Run the frontend without backend or database - perfect for UI development, demos, and quick previews!

## 🎭 Demo Mode

Demo mode uses mock data and simulates API responses, so you can explore the full UI without setting up PostgreSQL, Redis, or the backend server.

### Quick Start

```bash
cd frontend
npm install
npm run dev:demo
```

Open http://localhost:5173 and start exploring! 🚀

### What Works in Demo Mode

✅ **Full UI Navigation** - All pages and routes work
✅ **Mock Authentication** - Login with any email/password
✅ **Sample Audits** - Pre-populated audit data
✅ **Audit Results** - View detailed SEO issues and recommendations
✅ **Profile Management** - Update user profile
✅ **Subscription Info** - View mock subscription details
✅ **Realistic Delays** - API calls simulate network latency

### Demo Credentials

In demo mode, you can login with **any email and password**:
- Email: `demo@example.com`
- Password: `anything`

The mock API will accept any credentials and return a demo user.

## 🔧 Configuration

### Option 1: Using npm script (Recommended)

```bash
npm run dev:demo
```

This automatically loads `.env.demo` configuration.

### Option 2: Manual environment variable

```bash
# Create .env.local file
echo "VITE_DEMO_MODE=true" > .env.local

# Run normally
npm run dev
```

### Option 3: Command line

```bash
VITE_DEMO_MODE=true npm run dev
```

## 📦 Mock Data

The frontend includes realistic mock data:

### Sample Audits
- **example.com** - Completed audit with 85 health score
- **demo-site.com** - Completed audit with 72 health score
- **test-website.org** - Running audit (demonstrates pending state)

### Sample Issues
- Critical: Missing meta descriptions, missing H1 headings
- Warnings: Slow page load, duplicate titles
- Notices: Missing alt text on images

### User Profile
- Email: demo@example.com
- Plan: Pro
- Audits this month: 15/100

## 🎨 Use Cases

### 1. UI Development
Develop and test frontend features without running the backend:
```bash
npm run dev:demo
```

### 2. Design Reviews
Show stakeholders the UI without infrastructure:
```bash
npm run dev:demo
# Share http://localhost:5173
```

### 3. Frontend Testing
Test UI logic with consistent mock data:
```bash
npm run test
# Mock API is automatically used in tests
```

### 4. Quick Demos
Demonstrate the product quickly:
```bash
npm install && npm run dev:demo
# Ready in 30 seconds!
```

## 🔄 Switching Between Modes

### Demo Mode (No Backend)
```bash
npm run dev:demo
```

### Normal Mode (Requires Backend)
```bash
# Make sure backend is running first
cd ../backend && npm run dev

# Then start frontend
cd ../frontend
npm run dev
```

## 🛠️ Customizing Mock Data

Edit mock data in `src/services/mockData.ts`:

```typescript
export const mockAudits = [
  {
    id: '1',
    domain: 'your-site.com',
    status: 'completed',
    health_score: 90,
    // ... customize as needed
  },
];
```

## 📝 Environment Variables

### .env.demo (Demo Mode)
```bash
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:5000/api  # Not used in demo mode
```

### .env (Normal Mode)
```bash
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:5000/api  # Points to real backend
```

### .env.production
```bash
VITE_DEMO_MODE=false
VITE_API_URL=https://api.yoursite.com/api
```

## 🚀 Deployment

### Deploy Frontend Only (Demo Mode)

Deploy to Vercel/Netlify with demo mode enabled:

```bash
# Vercel
vercel --build-env VITE_DEMO_MODE=true

# Netlify
netlify deploy --build --build-env VITE_DEMO_MODE=true

# Or set in dashboard:
# VITE_DEMO_MODE=true
```

This creates a live demo that anyone can access without backend infrastructure!

### Deploy Frontend + Backend (Production Mode)

Normal deployment with real backend:

```bash
# Frontend
VITE_API_URL=https://api.yoursite.com/api npm run build

# Backend
# Deploy separately to Railway/Render
```

## 🎯 Benefits

✅ **Faster Development** - No backend startup time
✅ **No Infrastructure** - No PostgreSQL, Redis, or backend needed
✅ **Quick Demos** - Show UI to stakeholders instantly
✅ **Offline Development** - Work without internet/database
✅ **Easy Onboarding** - New developers can start immediately
✅ **Testing** - Consistent mock data for tests

## ⚠️ Limitations

🚫 **No Real Data Persistence** - Changes don't save between sessions
🚫 **No Real Crawling** - Can't audit actual websites
🚫 **No Authentication** - Mock auth only, not secure
🚫 **No Backend Features** - Email, payments, etc. are simulated

Demo mode is perfect for development and demos, but use normal mode with a real backend for production!

## 🔍 Debugging

Check if demo mode is active:
1. Open browser console (F12)
2. Look for: `🎭 DEMO MODE ACTIVE` banner
3. All API calls will use mock data

To disable demo mode:
```bash
# Remove from .env
VITE_DEMO_MODE=false

# Or just run normally
npm run dev
```

## 📚 Related Docs

- [Main README](../README.md) - Full project setup
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment
- [API Documentation](../docs/API.md) - Backend API reference

---

**Quick Commands:**

```bash
# Demo mode (no backend)
npm run dev:demo

# Normal mode (requires backend)
npm run dev

# Production build
npm run build

# Run tests
npm test
```

Enjoy developing without the backend! 🎉
