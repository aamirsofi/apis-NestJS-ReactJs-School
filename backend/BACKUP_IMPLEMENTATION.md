# Database Backup Implementation Guide

## Overview
This guide explains how to implement actual database backups for PostgreSQL in the School ERP Platform.

## Approaches

### 1. **Using `pg_dump` Command (Recommended)**
`pg_dump` is PostgreSQL's native backup utility. It's the most reliable and feature-complete option.

**Pros:**
- Native PostgreSQL tool, most reliable
- Supports custom formats, compression
- Can backup specific schemas/tables
- Fast and efficient

**Cons:**
- Requires `pg_dump` binary installed on server
- Need to execute shell commands from Node.js

### 2. **Using Node.js Libraries**
Libraries like `pg-dump` or `node-pg-dump` wrap `pg_dump` functionality.

**Pros:**
- Pure Node.js, no external dependencies
- Easier to handle errors
- Cross-platform compatible

**Cons:**
- May have limitations compared to native `pg_dump`
- Additional dependency

### 3. **Using TypeORM Query Builder**
Export data using TypeORM queries.

**Pros:**
- No external tools needed
- Full control over what to backup

**Cons:**
- Slow for large databases
- Doesn't backup schema/structure
- Complex to implement correctly
- Not recommended for production

## Recommended Implementation: Using `pg_dump`

### Step 1: Install Required Dependencies

```bash
npm install --save child_process
npm install --save-dev @types/node
```

### Step 2: Create Backup Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private configService: ConfigService) {
    // Create backups directory if it doesn't exist
    this.backupDir = this.configService.get<string>('BACKUP_DIR', './backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<{ success: boolean; message: string; filePath?: string; downloadUrl?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql`;
      const backupFilePath = path.join(this.backupDir, backupFileName);

      // Get database connection details
      const dbHost = this.configService.get<string>('DB_HOST', 'localhost');
      const dbPort = this.configService.get<number>('DB_PORT', 5432);
      const dbUsername = this.configService.get<string>('DB_USERNAME', 'postgres');
      const dbPassword = this.configService.get<string>('DB_PASSWORD', 'postgres');
      const dbName = this.configService.get<string>('DB_DATABASE', 'fee_management');

      // Build pg_dump command
      // Using PGPASSWORD environment variable for security
      const pgDumpCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUsername} -d ${dbName} -F c -f "${backupFilePath}"`;

      // Set environment variables
      const env = {
        ...process.env,
        PGPASSWORD: dbPassword,
      };

      this.logger.log(`Starting backup: ${backupFileName}`);

      // Execute pg_dump
      await execAsync(pgDumpCommand, { env, maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer

      // Verify backup file was created
      if (!fs.existsSync(backupFilePath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupFilePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      this.logger.log(`Backup created successfully: ${backupFileName} (${fileSizeMB} MB)`);

      // Clean up old backups if retention policy is set
      await this.cleanupOldBackups();

      return {
        success: true,
        message: `Backup created successfully: ${backupFileName} (${fileSizeMB} MB)`,
        filePath: backupFilePath,
        downloadUrl: `/api/settings/backup/download/${backupFileName}`,
      };
    } catch (error: any) {
      this.logger.error(`Backup failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || 'Failed to create backup',
      };
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const retentionDays = parseInt(
        await this.configService.get<string>('BACKUP_RETENTION_DAYS', '30')
      );

      if (retentionDays <= 0) return;

      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.startsWith('backup-') || !file.endsWith('.sql')) continue;

        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error cleaning up old backups: ${error.message}`);
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: number; createdAt: Date }>> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error: any) {
      this.logger.error(`Error listing backups: ${error.message}`);
      return [];
    }
  }

  async downloadBackup(fileName: string): Promise<string | null> {
    try {
      const filePath = path.join(this.backupDir, fileName);
      
      // Security: Prevent directory traversal
      if (!path.resolve(filePath).startsWith(path.resolve(this.backupDir))) {
        throw new Error('Invalid file path');
      }

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return filePath;
    } catch (error: any) {
      this.logger.error(`Error getting backup file: ${error.message}`);
      return null;
    }
  }
}
```

### Step 3: Update Settings Service

```typescript
// In settings.service.ts
import { BackupService } from '../backup/backup.service';

constructor(
  @InjectRepository(Setting)
  private settingsRepository: Repository<Setting>,
  private backupService: BackupService, // Inject BackupService
) {}

async createBackup(): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
  return this.backupService.createBackup();
}
```

### Step 4: Add Download Endpoint

```typescript
// In settings.controller.ts
import { Res, Param } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';

@Get('backup/download/:fileName')
async downloadBackup(
  @Param('fileName') fileName: string,
  @Res() res: Response,
) {
  const filePath = await this.settingsService.getBackupFilePath(fileName);
  
  if (!filePath || !fs.existsSync(filePath)) {
    throw new NotFoundException('Backup file not found');
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
```

## Alternative: Using `pg-dump` Node.js Library

If you prefer not to use shell commands:

```bash
npm install pg-dump
```

```typescript
import * as pgDump from 'pg-dump';

async createBackup(): Promise<{ success: boolean; message: string; filePath?: string }> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    const dump = await pgDump({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      database: this.configService.get<string>('DB_DATABASE', 'fee_management'),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
    });

    fs.writeFileSync(backupFilePath, dump);

    return {
      success: true,
      message: `Backup created successfully: ${backupFileName}`,
      filePath: backupFilePath,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create backup',
    };
  }
}
```

## Storage Options

### 1. **Local Filesystem** (Current Implementation)
- Simple and fast
- Good for development/small deployments
- Requires disk space management
- Not suitable for distributed systems

### 2. **Cloud Storage** (Recommended for Production)
- AWS S3, Google Cloud Storage, Azure Blob Storage
- Scalable and reliable
- Automatic redundancy
- Can be integrated with CDN

Example with AWS S3:
```typescript
import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async uploadToS3(filePath: string, fileName: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: process.env.S3_BACKUP_BUCKET,
    Key: `backups/${fileName}`,
    Body: fileContent,
    ContentType: 'application/octet-stream',
  };

  const result = await s3.upload(params).promise();
  return result.Location; // Returns S3 URL
}
```

## Environment Variables

Add to `.env`:
```env
# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# For cloud storage (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=your-backup-bucket
```

## Security Considerations

1. **File Permissions**: Ensure backup files are readable only by authorized users
2. **Path Traversal**: Always validate file paths to prevent directory traversal attacks
3. **Credentials**: Never log database passwords
4. **Access Control**: Restrict backup endpoints to super_admin role only
5. **Encryption**: Consider encrypting backup files at rest
6. **Secure Transfer**: Use HTTPS for backup downloads

## Scheduled Backups

You can use NestJS's `@nestjs/schedule` module for automatic backups:

```bash
npm install @nestjs/schedule
```

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BackupScheduler {
  constructor(private backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM) // Run daily at 2 AM
  async handleDailyBackup() {
    await this.backupService.createBackup();
  }
}
```

## Restoring Backups

To restore a backup:
```bash
# For SQL format
psql -h localhost -U postgres -d fee_management < backup-2024-01-01.sql

# For custom format
pg_restore -h localhost -U postgres -d fee_management backup-2024-01-01.dump
```

## Testing

1. Create a test backup
2. Verify file exists and has content
3. Test download endpoint
4. Test cleanup of old backups
5. Verify backup can be restored

## Production Checklist

- [ ] Configure backup directory with sufficient disk space
- [ ] Set up cloud storage (S3/GCS/Azure)
- [ ] Configure backup retention policy
- [ ] Set up monitoring/alerting for backup failures
- [ ] Test restore procedure
- [ ] Document backup/restore procedures
- [ ] Set up automated scheduled backups
- [ ] Encrypt backup files
- [ ] Test disaster recovery scenario

