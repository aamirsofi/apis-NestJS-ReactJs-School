# How to Create Your First User

## Option 1: Using Swagger UI (Recommended)

1. Make sure backend is running: `cd backend && npm run start:dev`
2. Open browser: http://localhost:3000/api-docs
3. Find `POST /api/auth/register`
4. Click "Try it out"
5. Use this JSON:
```json
{
  "name": "Super Admin",
  "email": "admin@example.com",
  "password": "admin123"
}
```
6. Click "Execute"
7. Login at http://localhost:5173 with:
   - Email: `admin@example.com`
   - Password: `admin123`

## Option 2: Using curl

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

## Option 3: Using the Admin Script

```bash
cd backend
npm run create:admin
```

This will create:
- Email: `admin@example.com`
- Password: `admin123`
- Role: `super_admin`

## Default Credentials (After Registration)

**Super Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Note:** The first user registered will have role `student` by default. To create a super admin, you can:

1. Register via Swagger
2. Then update the user role in the database, OR
3. Use the admin script: `npm run create:admin`

## Login

After creating a user, go to:
- Frontend: http://localhost:5173
- Enter email and password
- Click "Sign in"

