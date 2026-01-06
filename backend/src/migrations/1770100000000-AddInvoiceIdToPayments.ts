import { MigrationInterface, QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration to add invoice-based payment support
 * This allows payments to be made against invoices (new way)
 * while maintaining backward compatibility with student_fee_structures (old way)
 */
export class AddInvoiceIdToPayments1770100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add invoiceId column (nullable for backward compatibility)
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'invoiceId',
        type: 'integer',
        isNullable: true,
        comment: 'Reference to fee_invoices for invoice-based payments',
      }),
    );

    // Make studentFeeStructureId nullable (for invoice-based payments)
    await queryRunner.changeColumn(
      'payments',
      'studentFeeStructureId',
      new TableColumn({
        name: 'studentFeeStructureId',
        type: 'integer',
        isNullable: true, // Now nullable
        comment: 'Reference to student_fee_structures (legacy/old way)',
      }),
    );

    // Create index for invoiceId
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_invoice',
        columnNames: ['invoiceId'],
      }),
    );

    // Add foreign key to fee_invoices
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        name: 'FK_payments_invoice',
        columnNames: ['invoiceId'],
        referencedTableName: 'fee_invoices',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Add check constraint: must have EITHER studentFeeStructureId OR invoiceId
    await queryRunner.query(`
      ALTER TABLE payments
      ADD CONSTRAINT chk_payment_reference
      CHECK (
        ("studentFeeStructureId" IS NOT NULL AND "invoiceId" IS NULL) OR
        ("invoiceId" IS NOT NULL AND "studentFeeStructureId" IS NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE payments
      DROP CONSTRAINT IF EXISTS chk_payment_reference;
    `);

    // Drop foreign key
    await queryRunner.dropForeignKey('payments', 'FK_payments_invoice');

    // Drop index
    await queryRunner.dropIndex('payments', 'IDX_payments_invoice');

    // Make studentFeeStructureId NOT NULL again
    await queryRunner.changeColumn(
      'payments',
      'studentFeeStructureId',
      new TableColumn({
        name: 'studentFeeStructureId',
        type: 'integer',
        isNullable: false,
      }),
    );

    // Drop invoiceId column
    await queryRunner.dropColumn('payments', 'invoiceId');
  }
}

