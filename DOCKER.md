# Docker Setup Guide

This project supports multiple Docker configurations depending on your needs.

## Current Setup

✅ **Dockerfiles exist** for both backend and frontend:
- `backend/Dockerfile` - Production build for NestJS
- `backend/Dockerfile.dev` - Development build with hot reload
- `frontend/Dockerfile` - Production build for React (Nginx)
- `frontend/Dockerfile.dev` - Development build with Vite

## Docker Compose Options

### Option 1: Full Stack (Default - Recommended)

**File:** `docker-compose.yml`

Runs PostgreSQL, Backend, and Frontend all in Docker containers with a single command.

```bash
# Start everything with one command
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**When to use:**
- ✅ **Default choice** - Start everything quickly
- Consistent development environments
- Testing deployment scenarios
- CI/CD pipelines
- Team collaboration (everyone has same environment)

### Option 2: Database Only

**File:** `docker-compose.db-only.yml`

Runs only PostgreSQL. Backend and frontend run directly on your host machine.

```bash
# Start only PostgreSQL
docker-compose -f docker-compose.db-only.yml up -d

# Backend runs locally
cd backend
npm install
npm run start:dev

# Frontend runs locally
cd frontend
npm install
npm run dev
```

**When to use:**
- Local development with faster iteration
- Easier debugging (direct access to processes)
- When you prefer running Node.js directly

### Option 3: Production Build

**File:** `docker-compose.prod.yml`

Optimized production images with multi-stage builds.

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## Quick Reference

### Start Everything (Default)
```bash
docker-compose up -d
```
This starts PostgreSQL, Backend, and Frontend in one command! 🚀

### Start Database Only
```bash
docker-compose -f docker-compose.db-only.yml up -d
```

### Start Production
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
# Stop everything
docker-compose down

# Stop database only (if using db-only setup)
docker-compose -f docker-compose.db-only.yml down
```

### Rebuild After Changes
```bash
docker-compose up -d --build
```

## Environment Variables

### For Database Only Setup

When running backend/frontend locally, use `localhost`:

```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
```

### For Full Docker Setup

When running everything in Docker, use service names:

```env
# backend/.env (or docker-compose environment)
DB_HOST=postgres  # Service name, not localhost
DB_PORT=5432
```

## Troubleshooting

### Backend can't connect to database

**If running locally:**
- Ensure `DB_HOST=localhost` in `backend/.env`
- Check PostgreSQL is running: `docker-compose ps`

**If running in Docker:**
- Ensure `DB_HOST=postgres` (service name)
- Check network connectivity: `docker-compose exec backend ping postgres`

### Port conflicts

If ports are already in use:
- Change ports in docker-compose.yml
- Or stop conflicting services

### Volume mounting issues

On Windows/WSL, ensure:
- Docker Desktop has access to the project directory
- Use WSL2 backend in Docker Desktop settings

## Development Workflow

### Recommended: Full Docker (Default)

1. Start everything: `docker-compose up -d`
2. Code changes are reflected via volume mounts (hot reload enabled)
3. View logs: `docker-compose logs -f`

**Benefits:**
- ✅ Single command to start everything
- Consistent environment
- Isolated dependencies
- Production-like setup
- Hot reload works via volume mounts

### Alternative: Database Only

1. Start PostgreSQL: `docker-compose -f docker-compose.db-only.yml up -d`
2. Run backend locally: `cd backend && npm run start:dev`
3. Run frontend locally: `cd frontend && npm run dev`

**Benefits:**
- Faster iteration (no Docker overhead)
- Easier debugging (direct process access)
- Direct file access

## Building Images Manually

### Backend
```bash
cd backend
docker build -f Dockerfile.dev -t fee-management-backend:dev .
docker build -f Dockerfile -t fee-management-backend:prod .
```

### Frontend
```bash
cd frontend
docker build -f Dockerfile.dev -t fee-management-frontend:dev .
docker build -f Dockerfile -t fee-management-frontend:prod .
```

## Quick Start (One Command!)

```bash
# Start everything
docker-compose up -d
```

That's it! 🎉 

Access your services:
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000/api
- 📚 Swagger Docs: http://localhost:3000/api-docs
- 🗄️ PostgreSQL: localhost:5432

View logs:
```bash
docker-compose logs -f
```

Stop everything:
```bash
docker-compose down
```

