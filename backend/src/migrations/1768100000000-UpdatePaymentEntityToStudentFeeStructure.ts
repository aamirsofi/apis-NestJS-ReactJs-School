import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdatePaymentEntityToStudentFeeStructure1768100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    if (!table) {
      throw new Error('Table payments not found');
    }

    // Helper function to check if column exists
    const columnExists = (columnName: string): boolean => {
      return table.findColumnByName(columnName) !== undefined;
    };

    // Helper function to check if foreign key exists
    const foreignKeyExists = async (fkName: string): Promise<boolean> => {
      const fks = table.foreignKeys.filter(fk => fk.name === fkName);
      return fks.length > 0;
    };

    // Add new column for studentFeeStructureId - only if doesn't exist
    if (!columnExists('studentFeeStructureId')) {
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'studentFeeStructureId',
          type: 'int',
          isNullable: true, // Make nullable initially to handle existing data
        }),
      );
    }

    // Add receiptNumber column - only if doesn't exist
    if (!columnExists('receiptNumber')) {
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'receiptNumber',
          type: 'varchar',
          length: '100',
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    // Drop old foreign key - only if exists
    if (await foreignKeyExists('FK_payments_feeStructureId')) {
      await queryRunner.dropForeignKey('payments', 'FK_payments_feeStructureId');
    }

    // Drop old column - only if exists
    if (columnExists('feeStructureId')) {
      await queryRunner.dropColumn('payments', 'feeStructureId');
    }

    // Add foreign key for studentFeeStructureId - only if doesn't exist
    if (!(await foreignKeyExists('FK_payments_studentFeeStructureId'))) {
      await queryRunner.createForeignKey(
        'payments',
        new TableForeignKey({
          columnNames: ['studentFeeStructureId'],
          referencedTableName: 'student_fee_structures',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'FK_payments_studentFeeStructureId',
        }),
      );
    }

    // Make studentFeeStructureId NOT NULL after foreign key is created (if it was nullable)
    // Note: This should only be done if there's no existing data, or after migrating existing data
    const studentFeeStructureColumn = table.findColumnByName('studentFeeStructureId');
    if (studentFeeStructureColumn && studentFeeStructureColumn.isNullable) {
      // Check if there are any existing payments
      const result = await queryRunner.query('SELECT COUNT(*) as count FROM payments');
      const count = parseInt(result[0]?.count || '0', 10);
      
      // Only make NOT NULL if there are no existing payments
      if (count === 0) {
        await queryRunner.query('ALTER TABLE "payments" ALTER COLUMN "studentFeeStructureId" SET NOT NULL');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new foreign key
    await queryRunner.dropForeignKey('payments', 'FK_payments_studentFeeStructureId');

    // Add back old column
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'feeStructureId',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );

    // Add back old foreign key
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['feeStructureId'],
        referencedTableName: 'fee_structures',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_payments_feeStructureId',
      }),
    );

    // Drop new columns
    await queryRunner.dropColumn('payments', 'receiptNumber');
    await queryRunner.dropColumn('payments', 'studentFeeStructureId');
  }
}

