import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(
    private configService: ConfigService,
    @InjectDataSource() private dataSource: DataSource,
  ) {
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

      this.logger.log(`Starting backup: ${backupFileName}`);

      // Try pg_dump first (from Docker container if available), fallback to Node.js method
      let backupSuccess = false;
      const dockerContainerName = this.configService.get<string>('POSTGRES_CONTAINER_NAME', 'fee_management_db');
      
      try {
        // First try pg_dump from Docker container (if Docker is available)
        if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
          try {
            backupSuccess = await this.createBackupWithDockerPgDump(
              dockerContainerName,
              dbUsername,
              dbPassword,
              dbName,
              backupFilePath,
            );
            if (backupSuccess) {
              this.logger.log('Backup created using Docker pg_dump');
            }
          } catch (dockerError: any) {
            this.logger.debug(`Docker pg_dump failed: ${dockerError.message}`);
          }
        }
        
        // If Docker method didn't work, try local pg_dump
        if (!backupSuccess) {
          backupSuccess = await this.createBackupWithPgDump(
            dbHost,
            dbPort,
            dbUsername,
            dbPassword,
            dbName,
            backupFilePath,
          );
        }
      } catch (pgDumpError: any) {
        this.logger.warn(`pg_dump failed, trying Node.js fallback: ${pgDumpError.message}`);
      }
      
      // Fallback to Node.js-based backup if pg_dump methods failed
      if (!backupSuccess) {
        this.logger.log('Using Node.js fallback method for backup');
        backupSuccess = await this.createBackupWithNodeJs(
          dbHost,
          dbPort,
          dbUsername,
          dbPassword,
          dbName,
          backupFilePath,
        );
      }

      if (!backupSuccess || !fs.existsSync(backupFilePath)) {
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

  private async createBackupWithDockerPgDump(
    containerName: string,
    username: string,
    password: string,
    database: string,
    outputPath: string,
  ): Promise<boolean> {
    // Use docker exec to run pg_dump inside the container
    // Output is redirected to the host file
    const dockerCommand = `docker exec ${containerName} PGPASSWORD=${password} pg_dump -U ${username} -d ${database} -F p`;
    
    const { stdout } = await execAsync(dockerCommand, {
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large databases
    });

    // Write output to file
    fs.writeFileSync(outputPath, stdout);

    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
  }

  private async createBackupWithPgDump(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
    outputPath: string,
  ): Promise<boolean> {
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${outputPath}"`;
    
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    await execAsync(pgDumpCommand, { 
      env, 
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    return fs.existsSync(outputPath);
  }

  private async createBackupWithNodeJs(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
    outputPath: string,
  ): Promise<boolean> {
    const client = new Client({
      host,
      port,
      user: username,
      password,
      database,
    });

    const writeStream = fs.createWriteStream(outputPath);
    
    try {
      await client.connect();
      this.logger.log('Connected to database for Node.js backup');

      // Write header
      writeStream.write(`-- PostgreSQL database backup\n`);
      writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
      writeStream.write(`-- Database: ${database}\n\n`);
      writeStream.write(`SET statement_timeout = 0;\n`);
      writeStream.write(`SET lock_timeout = 0;\n`);
      writeStream.write(`SET idle_in_transaction_session_timeout = 0;\n`);
      writeStream.write(`SET client_encoding = 'UTF8';\n`);
      writeStream.write(`SET standard_conforming_strings = on;\n`);
      writeStream.write(`SELECT pg_catalog.set_config('search_path', '', false);\n`);
      writeStream.write(`SET check_function_bodies = false;\n`);
      writeStream.write(`SET xmloption = content;\n`);
      writeStream.write(`SET client_min_messages = warning;\n`);
      writeStream.write(`SET row_security = off;\n\n`);

      // Get all tables
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);

      const tables = tablesResult.rows.map((row: any) => row.tablename);

      // Export each table
      for (const table of tables) {
        this.logger.log(`Exporting table: ${table}`);
        
        // Get table structure
        const structureResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        // Create table statement
        writeStream.write(`\n-- Table: ${table}\n`);
        writeStream.write(`DROP TABLE IF EXISTS "${table}" CASCADE;\n`);
        writeStream.write(`CREATE TABLE "${table}" (\n`);

        const columns = structureResult.rows.map((col: any, index: number) => {
          let colDef = `  "${col.column_name}" ${col.data_type}`;
          if (col.character_maximum_length) {
            colDef += `(${col.character_maximum_length})`;
          }
          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }
          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }
          return colDef;
        });

        writeStream.write(columns.join(',\n'));
        writeStream.write(`\n);\n\n`);

        // Export data
        const dataResult = await client.query(`SELECT * FROM "${table}"`);
        
        if (dataResult.rows.length > 0) {
          writeStream.write(`-- Data for table: ${table}\n`);
          
          for (const row of dataResult.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;
              }
              if (value instanceof Date) {
                return `'${value.toISOString()}'`;
              }
              return String(value);
            });
            
            writeStream.write(`INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`);
          }
          writeStream.write(`\n`);
        }
      }

      // Close write stream
      writeStream.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      await client.end();
      return true;
    } catch (error: any) {
      writeStream.end();
      await client.end();
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      // Get retention days from settings or environment variable
      const retentionDays = parseInt(
        this.configService.get<string>('BACKUP_RETENTION_DAYS', '30')
      );

      if (retentionDays <= 0) return;

      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const file of files) {
        if (!file.startsWith('backup-') || !file.endsWith('.sql')) continue;

        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error: any) {
      this.logger.error(`Error cleaning up old backups: ${error.message}`);
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: number; sizeFormatted: string; createdAt: Date }>> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          return {
            name: file,
            size: stats.size,
            sizeFormatted: `${sizeMB} MB`,
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

  async getBackupFilePath(fileName: string): Promise<string | null> {
    try {
      const filePath = path.join(this.backupDir, fileName);
      
      // Security: Prevent directory traversal attacks
      const resolvedPath = path.resolve(filePath);
      const resolvedBackupDir = path.resolve(this.backupDir);
      
      if (!resolvedPath.startsWith(resolvedBackupDir)) {
        this.logger.warn(`Invalid backup file path attempted: ${fileName}`);
        return null;
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

