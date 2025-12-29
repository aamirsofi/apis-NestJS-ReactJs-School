# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL running (via Docker or locally)
- Docker (optional, for database only)

## Step 1: Start Database

### Option A: Using Docker (Recommended)
```bash
docker-compose -f docker-compose.db-only.yml up -d
```

### Option B: Local PostgreSQL
Make sure PostgreSQL is running on `localhost:5432` with:
- Database: `fee_management`
- Username: `postgres`
- Password: `postgres`

## Step 2: Setup Backend

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Create .env file (copy from .env.example if exists, or create new)
# Required environment variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=fee_management
# JWT_SECRET=your-secret-key-change-this
# JWT_EXPIRES_IN=7d
# PORT=3000
# CORS_ORIGIN=http://localhost:5173

# Run migrations (if using TypeORM migrations)
npm run typeorm migration:run

# Start backend in development mode
npm run start:dev
```

Backend will run on: **http://localhost:3000**
API Docs: **http://localhost:3000/api-docs**

## Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start frontend in development mode
npm run dev
```

Frontend will run on: **http://localhost:5173**

## Step 4: Access the Application

1. Open browser: **http://localhost:5173**
2. Login page will appear
3. Register a new user or use existing credentials

## Troubleshooting

### Backend not starting?
- Check if PostgreSQL is running
- Verify database credentials in `.env`
- Check if port 3000 is available

### Frontend not connecting to backend?
- Verify backend is running on port 3000
- Check CORS settings in `backend/src/main.ts`
- Verify API_URL in `frontend/src/services/api.ts`

### Database connection errors?
- Ensure PostgreSQL is running
- Check database credentials
- Verify database `fee_management` exists

## Default URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api-docs

