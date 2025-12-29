# Frontend Troubleshooting Guide

## Common Issues

### 1. Frontend not connecting to backend

**Symptoms:**
- Network errors in browser console
- "Failed to fetch" errors
- CORS errors

**Solutions:**

1. **Check if backend is running:**
   ```bash
   # Backend should be on http://localhost:3000
   curl http://localhost:3000/api
   ```

2. **Verify API URL:**
   - The frontend uses `/api` (relative URL) which works with Vite proxy
   - If you need absolute URL, set `VITE_API_URL=http://localhost:3000/api` in `.env`

3. **Check CORS settings:**
   - Backend CORS should allow `http://localhost:5173`
   - Check `backend/src/main.ts` CORS configuration

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear localStorage if needed

### 2. Port 5173 already in use

**Solution:**
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

### 3. Module not found errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 4. TypeScript errors

**Solution:**
```bash
cd frontend
npm run build
# Check for TypeScript errors and fix them
```

### 5. Blank page / White screen

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Verify all dependencies are installed:
   ```bash
   npm install
   ```

### 6. Login not working

**Check:**
1. Backend is running on port 3000
2. Database is connected
3. Check browser console for API errors
4. Verify JWT_SECRET is set in backend `.env`

## Quick Test

1. **Start backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser:**
   - Go to: http://localhost:5173
   - Should see login page
   - Open browser DevTools (F12) and check Console tab for errors

4. **Test API connection:**
   - Open browser DevTools → Network tab
   - Try to login
   - Check if `/api/auth/login` request succeeds

## Environment Variables

Create `frontend/.env` if needed:
```
VITE_API_URL=http://localhost:3000/api
```

Note: Using relative URL `/api` works with Vite proxy and doesn't require this.

