# Quick Fix for ERR_CONNECTION_REFUSED

## Issue
Frontend can't connect to backend API.

## Solutions

### 1. Make sure both servers are running

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Should see: `🚀 Application is running on: http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Should see: `Local: http://localhost:5173`

### 2. Check if backend is accessible

Open in browser:
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api-docs

If these don't work, restart the backend.

### 3. Verify Vite proxy

The frontend uses Vite proxy to forward `/api/*` requests to `http://localhost:3000`.

If proxy isn't working:
1. Restart the frontend dev server
2. Check `frontend/vite.config.ts` proxy configuration
3. Try accessing backend directly: http://localhost:3000/api/students (with auth token)

### 4. Check CORS

Backend CORS should allow `http://localhost:5173`. Check `backend/src/main.ts`.

### 5. Clear browser cache

- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### 6. Check browser console

Open DevTools (F12) → Console tab:
- Look for specific error messages
- Check Network tab to see which requests are failing

### 7. Restart everything

```bash
# Stop both servers (Ctrl+C)

# Restart backend
cd backend
npm run start:dev

# Restart frontend (new terminal)
cd frontend
npm run dev
```

## Common Causes

1. **Backend crashed** - Check backend terminal for errors
2. **Port conflict** - Another app using port 3000 or 5173
3. **Database connection** - Backend can't connect to PostgreSQL
4. **Vite proxy issue** - Dev server needs restart

## Still not working?

Check backend logs for errors:
```bash
cd backend
npm run start:dev
```

Look for:
- Database connection errors
- Port already in use errors
- TypeScript compilation errors

