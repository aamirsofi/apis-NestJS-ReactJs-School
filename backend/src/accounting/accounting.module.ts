import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountsService } from './accounts.service';
import { AccountingController } from './accounting.controller';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry, JournalEntryLine])],
  controllers: [AccountingController, AccountsController],
  providers: [AccountingService, AccountsService],
  exports: [AccountingService, AccountsService],
})
export class AccountingModule {}

