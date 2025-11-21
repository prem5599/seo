# DEBUG GUIDE - Frontend Demo Mode

## Step 1: Clean Everything

```powershell
# Go to frontend directory
cd "D:\bizinsights\biz\BIz claude code\bizinsights\seo\frontend"

# Delete node_modules and build cache
Remove-Item -Recurse -Force node_modules, dist, .vite -ErrorAction SilentlyContinue

# Pull latest changes
git pull origin claude/frontend-standalone-01Rdu54YPRu7TMHg4d5nE4Vq

# Install fresh dependencies
npm install
```

## Step 2: Verify Demo Mode Configuration

Check if `.env.demo` file exists:
```powershell
Get-Content .env.demo
```

Should show:
```
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Build to Test

```powershell
npm run build
```

Look for this output:
```
✓ built in Xs
dist/assets/index-XXXXX.css   17.51 kB
dist/assets/index-XXXXX.js   237.15 kB
```

If CSS is only 4-5 KB, Tailwind is not generating!

## Step 4: Run Demo Mode

```powershell
npm run dev:demo
```

Should show:
```
VITE v7.2.2  ready in X ms
➜  Local:   http://localhost:5173/
```

## Step 5: Open Browser and Check Console

1. Open http://localhost:5173
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for this message:
   ```
   🎭 DEMO MODE ACTIVE
   Running with mock data - no backend required!
   ```

## If You See White Screen:

### Check 1: Console Errors
Look in browser console (F12) for red error messages. Copy them here.

### Check 2: Network Tab
- Go to Network tab in DevTools
- Refresh page
- Check if CSS file is loading (should be ~17KB)
- Check if JS file is loading (should be ~237KB)

### Check 3: Elements Tab
- Go to Elements tab
- Look at `<html>` tag
- Does it have Tailwind classes rendered?

## Common Issues:

### Issue 1: Parent package.json corrupted
```powershell
Remove-Item "D:\bizinsights\biz\BIz claude code\bizinsights\package.json" -Force
```

### Issue 2: Browser cache
Hard refresh: Ctrl + Shift + R (or Ctrl + F5)

### Issue 3: Wrong .env file loaded
Vite loads `.env.demo` when you run `npm run dev:demo`
Check console for demo banner!

### Issue 4: Port already in use
```powershell
# Kill any process using port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## Still Not Working?

Send me:
1. Screenshot of browser console (F12)
2. Screenshot of what you see on screen
3. Output of: `npm run dev:demo`
4. Output of: `Get-Content .env.demo`

## Quick Test (Skip Demo Mode)

Try running WITHOUT demo mode:
```powershell
npm run dev
```

Open http://localhost:5173

If this works but demo mode doesn't, the issue is with .env.demo loading.
