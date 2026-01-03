import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';

@Module({
  imports: [TypeOrmModule],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}

