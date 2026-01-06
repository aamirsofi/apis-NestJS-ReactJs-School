import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAccountingAndInvoiceTables1769000000000 implements MigrationInterface {
  // Helper function to check if table exists
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    return table !== undefined;
  }

  // Helper function to check if foreign key exists
  private async foreignKeyExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnNames: string[],
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return false;
    return table.foreignKeys.some(
      fk => fk.columnNames.length === columnNames.length && fk.columnNames.every((name, i) => name === columnNames[i]),
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table (Chart of Accounts) - only if doesn't exist
    const accountsTableExists = await this.tableExists(queryRunner, 'accounts');
    if (!accountsTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'schoolId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['asset', 'liability', 'equity', 'income', 'expense'],
            isNullable: false,
          },
          {
            name: 'subtype',
            type: 'enum',
            enum: [
              'current_asset',
              'fixed_asset',
              'cash',
              'bank',
              'receivable',
              'current_liability',
              'long_term_liability',
              'unearned_revenue',
              'operating_income',
              'non_operating_income',
              'operating_expense',
              'non_operating_expense',
            ],
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSystemAccount',
            type: 'boolean',
            default: false,
          },
          {
            name: 'parentAccountId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'openingBalance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'openingBalanceDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    // Create indexes for accounts - only if they don't exist
    const accountsTable = await queryRunner.getTable('accounts');
    if (accountsTable) {
      const idxSchoolCodeExists = accountsTable.indices.some(idx => idx.name === 'IDX_accounts_school_code');
      if (!idxSchoolCodeExists) {
        await queryRunner.createIndex(
          'accounts',
          new TableIndex({
            name: 'IDX_accounts_school_code',
            columnNames: ['schoolId', 'code'],
            isUnique: true,
          }),
        );
      }

      const idxSchoolNameExists = accountsTable.indices.some(idx => idx.name === 'IDX_accounts_school_name');
      if (!idxSchoolNameExists) {
        await queryRunner.createIndex(
          'accounts',
          new TableIndex({
            name: 'IDX_accounts_school_name',
            columnNames: ['schoolId', 'name'],
          }),
        );
      }

      // Create foreign keys for accounts - only if they don't exist
      if (!(await this.foreignKeyExists(queryRunner, 'accounts', ['schoolId']))) {
        await queryRunner.createForeignKey(
          'accounts',
          new TableForeignKey({
            name: 'FK_accounts_schoolId',
            columnNames: ['schoolId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'schools',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'accounts', ['parentAccountId']))) {
        await queryRunner.createForeignKey(
          'accounts',
          new TableForeignKey({
            name: 'FK_accounts_parentAccountId',
            columnNames: ['parentAccountId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'accounts',
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    // Create journal_entries table - only if doesn't exist
    const journalEntriesTableExists = await this.tableExists(queryRunner, 'journal_entries');
    if (!journalEntriesTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'journal_entries',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'schoolId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'entryNumber',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'entryDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'invoice',
              'payment',
              'advance_payment',
              'advance_adjustment',
              'refund',
              'adjustment',
              'opening_balance',
              'transfer',
            ],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'posted', 'reversed'],
            default: "'draft'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'referenceId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'totalDebit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalCredit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'postedById',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'postedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reversedById',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'reversedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'reversedEntryId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    // Create indexes for journal_entries - only if they don't exist
    const journalEntriesTable = await queryRunner.getTable('journal_entries');
    if (journalEntriesTable) {
      const idxSchoolEntryNumberExists = journalEntriesTable.indices.some(
        idx => idx.name === 'IDX_journal_entries_school_entry_number',
      );
      if (!idxSchoolEntryNumberExists) {
        await queryRunner.createIndex(
          'journal_entries',
          new TableIndex({
            name: 'IDX_journal_entries_school_entry_number',
            columnNames: ['schoolId', 'entryNumber'],
            isUnique: true,
          }),
        );
      }

      const idxSchoolDateExists = journalEntriesTable.indices.some(
        idx => idx.name === 'IDX_journal_entries_school_date',
      );
      if (!idxSchoolDateExists) {
        await queryRunner.createIndex(
          'journal_entries',
          new TableIndex({
            name: 'IDX_journal_entries_school_date',
            columnNames: ['schoolId', 'entryDate'],
          }),
        );
      }

      const idxSchoolTypeExists = journalEntriesTable.indices.some(
        idx => idx.name === 'IDX_journal_entries_school_type',
      );
      if (!idxSchoolTypeExists) {
        await queryRunner.createIndex(
          'journal_entries',
          new TableIndex({
            name: 'IDX_journal_entries_school_type',
            columnNames: ['schoolId', 'type'],
          }),
        );
      }

      const idxSchoolStatusExists = journalEntriesTable.indices.some(
        idx => idx.name === 'IDX_journal_entries_school_status',
      );
      if (!idxSchoolStatusExists) {
        await queryRunner.createIndex(
          'journal_entries',
          new TableIndex({
            name: 'IDX_journal_entries_school_status',
            columnNames: ['schoolId', 'status'],
          }),
        );
      }

      // Create foreign keys for journal_entries - only if they don't exist
      if (!(await this.foreignKeyExists(queryRunner, 'journal_entries', ['schoolId']))) {
        await queryRunner.createForeignKey(
          'journal_entries',
          new TableForeignKey({
            name: 'FK_journal_entries_schoolId',
            columnNames: ['schoolId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'schools',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'journal_entries', ['postedById']))) {
        await queryRunner.createForeignKey(
          'journal_entries',
          new TableForeignKey({
            name: 'FK_journal_entries_postedById',
            columnNames: ['postedById'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'journal_entries', ['reversedById']))) {
        await queryRunner.createForeignKey(
          'journal_entries',
          new TableForeignKey({
            name: 'FK_journal_entries_reversedById',
            columnNames: ['reversedById'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'journal_entries', ['reversedEntryId']))) {
        await queryRunner.createForeignKey(
          'journal_entries',
          new TableForeignKey({
            name: 'FK_journal_entries_reversedEntryId',
            columnNames: ['reversedEntryId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'journal_entries',
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    // Create journal_entry_lines table - only if doesn't exist
    const journalEntryLinesTableExists = await this.tableExists(queryRunner, 'journal_entry_lines');
    if (!journalEntryLinesTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'journal_entry_lines',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'journalEntryId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'accountId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'debitAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'creditAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
      );
    }

    // Create indexes and foreign keys for journal_entry_lines - only if they don't exist
    const journalEntryLinesTable = await queryRunner.getTable('journal_entry_lines');
    if (journalEntryLinesTable) {
      const idxEntryAccountExists = journalEntryLinesTable.indices.some(
        idx => idx.name === 'IDX_journal_entry_lines_entry_account',
      );
      if (!idxEntryAccountExists) {
        await queryRunner.createIndex(
          'journal_entry_lines',
          new TableIndex({
            name: 'IDX_journal_entry_lines_entry_account',
            columnNames: ['journalEntryId', 'accountId'],
          }),
        );
      }

      // Create foreign keys for journal_entry_lines - only if they don't exist
      if (!(await this.foreignKeyExists(queryRunner, 'journal_entry_lines', ['journalEntryId']))) {
        await queryRunner.createForeignKey(
          'journal_entry_lines',
          new TableForeignKey({
            name: 'FK_journal_entry_lines_journalEntryId',
            columnNames: ['journalEntryId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'journal_entries',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'journal_entry_lines', ['accountId']))) {
        await queryRunner.createForeignKey(
          'journal_entry_lines',
          new TableForeignKey({
            name: 'FK_journal_entry_lines_accountId',
            columnNames: ['accountId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'accounts',
            onDelete: 'RESTRICT',
          }),
        );
      }
    }

    // Create fee_invoices table - only if doesn't exist
    const feeInvoicesTableExists = await this.tableExists(queryRunner, 'fee_invoices');
    if (!feeInvoicesTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'fee_invoices',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'schoolId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'academicYearId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'invoiceNumber',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'issueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['monthly', 'quarterly', 'yearly', 'one_time'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'],
            default: "'draft'",
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paidAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'discountAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'balanceAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'journalEntryId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    // Create indexes and foreign keys for fee_invoices - only if they don't exist
    const feeInvoicesTable = await queryRunner.getTable('fee_invoices');
    if (feeInvoicesTable) {
      const idxSchoolInvoiceNumberExists = feeInvoicesTable.indices.some(
        idx => idx.name === 'IDX_fee_invoices_school_invoice_number',
      );
      if (!idxSchoolInvoiceNumberExists) {
        await queryRunner.createIndex(
          'fee_invoices',
          new TableIndex({
            name: 'IDX_fee_invoices_school_invoice_number',
            columnNames: ['schoolId', 'invoiceNumber'],
            isUnique: true,
          }),
        );
      }

      const idxSchoolStudentExists = feeInvoicesTable.indices.some(
        idx => idx.name === 'IDX_fee_invoices_school_student',
      );
      if (!idxSchoolStudentExists) {
        await queryRunner.createIndex(
          'fee_invoices',
          new TableIndex({
            name: 'IDX_fee_invoices_school_student',
            columnNames: ['schoolId', 'studentId'],
          }),
        );
      }

      const idxSchoolStatusExists = feeInvoicesTable.indices.some(
        idx => idx.name === 'IDX_fee_invoices_school_status',
      );
      if (!idxSchoolStatusExists) {
        await queryRunner.createIndex(
          'fee_invoices',
          new TableIndex({
            name: 'IDX_fee_invoices_school_status',
            columnNames: ['schoolId', 'status'],
          }),
        );
      }

      const idxSchoolIssueDateExists = feeInvoicesTable.indices.some(
        idx => idx.name === 'IDX_fee_invoices_school_issue_date',
      );
      if (!idxSchoolIssueDateExists) {
        await queryRunner.createIndex(
          'fee_invoices',
          new TableIndex({
            name: 'IDX_fee_invoices_school_issue_date',
            columnNames: ['schoolId', 'issueDate'],
          }),
        );
      }

      // Create foreign keys for fee_invoices - only if they don't exist
      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoices', ['schoolId']))) {
        await queryRunner.createForeignKey(
          'fee_invoices',
          new TableForeignKey({
            name: 'FK_fee_invoices_schoolId',
            columnNames: ['schoolId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'schools',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoices', ['studentId']))) {
        await queryRunner.createForeignKey(
          'fee_invoices',
          new TableForeignKey({
            name: 'FK_fee_invoices_studentId',
            columnNames: ['studentId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'students',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoices', ['academicYearId']))) {
        await queryRunner.createForeignKey(
          'fee_invoices',
          new TableForeignKey({
            name: 'FK_fee_invoices_academicYearId',
            columnNames: ['academicYearId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'academic_years',
            onDelete: 'RESTRICT',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoices', ['journalEntryId']))) {
        await queryRunner.createForeignKey(
          'fee_invoices',
          new TableForeignKey({
            name: 'FK_fee_invoices_journalEntryId',
            columnNames: ['journalEntryId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'journal_entries',
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    // Create fee_invoice_items table - only if doesn't exist
    const feeInvoiceItemsTableExists = await this.tableExists(queryRunner, 'fee_invoice_items');
    if (!feeInvoiceItemsTableExists) {
      await queryRunner.createTable(
      new Table({
        name: 'fee_invoice_items',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'invoiceId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'feeStructureId',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'discountAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
      );
    }

    // Create indexes and foreign keys for fee_invoice_items - only if they don't exist
    const feeInvoiceItemsTable = await queryRunner.getTable('fee_invoice_items');
    if (feeInvoiceItemsTable) {
      const idxInvoiceExists = feeInvoiceItemsTable.indices.some(
        idx => idx.name === 'IDX_fee_invoice_items_invoice',
      );
      if (!idxInvoiceExists) {
        await queryRunner.createIndex(
          'fee_invoice_items',
          new TableIndex({
            name: 'IDX_fee_invoice_items_invoice',
            columnNames: ['invoiceId'],
          }),
        );
      }

      // Create foreign keys for fee_invoice_items - only if they don't exist
      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoice_items', ['invoiceId']))) {
        await queryRunner.createForeignKey(
          'fee_invoice_items',
          new TableForeignKey({
            name: 'FK_fee_invoice_items_invoiceId',
            columnNames: ['invoiceId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'fee_invoices',
            onDelete: 'CASCADE',
          }),
        );
      }

      if (!(await this.foreignKeyExists(queryRunner, 'fee_invoice_items', ['feeStructureId']))) {
        await queryRunner.createForeignKey(
          'fee_invoice_items',
          new TableForeignKey({
            name: 'FK_fee_invoice_items_feeStructureId',
            columnNames: ['feeStructureId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'fee_structures',
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('fee_invoice_items', true);
    await queryRunner.dropTable('fee_invoices', true);
    await queryRunner.dropTable('journal_entry_lines', true);
    await queryRunner.dropTable('journal_entries', true);
    await queryRunner.dropTable('accounts', true);
  }
}

