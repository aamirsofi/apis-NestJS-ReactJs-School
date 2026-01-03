# Docker PostgreSQL Backup Guide

## Current Setup

The backup system works perfectly with Docker PostgreSQL! Here's how:

### How It Works

1. **Node.js Fallback (Current Default)**
   - Connects directly to your Docker PostgreSQL container
   - Uses the `pg` library (already installed)
   - Works without any additional setup
   - No need for `pg_dump` on your host machine

2. **pg_dump Options** (Optional, for better performance)

## Option 1: Use Node.js Fallback (Recommended for Docker)

**Status:** ✅ Already Working!

The current implementation automatically falls back to Node.js-based backup when `pg_dump` is not found. This works perfectly with Docker PostgreSQL because:

- It connects directly to the database (same as your app)
- Uses the same connection settings from your `.env` file
- No Docker commands needed
- Works on any platform (Windows, Linux, macOS)

**No action needed** - your backups should work right now!

## Option 2: Use pg_dump from Docker Container

If you want to use `pg_dump` for better performance, you can execute it inside the Docker container:

### Method A: Execute pg_dump inside container

```bash
# Create backup from inside container
docker exec -t your-postgres-container pg_dump -U postgres fee_management > backup.sql

# Or with password
docker exec -t your-postgres-container PGPASSWORD=yourpassword pg_dump -U postgres fee_management > backup.sql
```

### Method B: Use docker exec in backup service

Update the backup service to use Docker exec:

```typescript
private async createBackupWithPgDumpFromDocker(
  containerName: string,
  database: string,
  username: string,
  password: string,
  outputPath: string,
): Promise<boolean> {
  const dockerCommand = `docker exec -t ${containerName} PGPASSWORD=${password} pg_dump -U ${username} ${database} > "${outputPath}"`;
  
  await execAsync(dockerCommand, { 
    maxBuffer: 1024 * 1024 * 10 
  });

  return fs.existsSync(outputPath);
}
```

## Option 3: Install PostgreSQL Client Tools on Host

If you want `pg_dump` available on your host machine:

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install only "PostgreSQL Client Tools" (not the full server)
3. Add to PATH: `C:\Program Files\PostgreSQL\[version]\bin`

### Linux
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

### macOS
```bash
brew install libpq
brew link --force libpq
```

## Recommended Approach for Docker

**For Docker setups, I recommend using the Node.js fallback** because:

1. ✅ No additional dependencies
2. ✅ Works on any platform
3. ✅ Same connection logic as your app
4. ✅ No Docker exec commands needed
5. ✅ Easier to maintain

The Node.js method generates valid SQL files that can be restored with:
```bash
docker exec -i your-postgres-container psql -U postgres fee_management < backup.sql
```

## Testing Your Backup

1. Go to System Settings → Backup tab
2. Click "Create Manual Backup"
3. Check the backup history table
4. Download a backup file
5. Verify it's a valid SQL file

## Restoring Backups

To restore a backup file:

```bash
# Copy backup file to container
docker cp backup-2024-01-15.sql your-postgres-container:/tmp/

# Restore inside container
docker exec -i your-postgres-container psql -U postgres fee_management < /tmp/backup-2024-01-15.sql

# Or restore directly
docker exec -i your-postgres-container psql -U postgres fee_management < backup-2024-01-15.sql
```

## Environment Variables

Make sure your `.env` has the correct Docker PostgreSQL connection:

```env
DB_HOST=localhost          # or your Docker container name/IP
DB_PORT=5432               # or your mapped port
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=fee_management
```

If your PostgreSQL is in Docker, `DB_HOST` should be:
- `localhost` if port is mapped to host
- Container name if in same Docker network
- Docker service name if using docker-compose

## Summary

✅ **Current setup works with Docker PostgreSQL** - No changes needed!

The Node.js fallback automatically handles Docker PostgreSQL connections. Just make sure your `.env` file has the correct connection settings pointing to your Docker container.

