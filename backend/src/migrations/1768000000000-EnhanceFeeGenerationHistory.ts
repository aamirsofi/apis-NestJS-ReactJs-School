import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceFeeGenerationHistory1768000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('fee_generation_history');
    if (!table) {
      throw new Error('Table fee_generation_history not found');
    }

    // Helper function to check if column exists
    const columnExists = (columnName: string): boolean => {
      return table.findColumnByName(columnName) !== undefined;
    };

    // Add fee structure IDs (JSON array) - only if doesn't exist
    if (!columnExists('feeStructureIds')) {
      await queryRunner.addColumn(
        'fee_generation_history',
        new TableColumn({
          name: 'feeStructureIds',
          type: 'json',
          isNullable: true,
        }),
      );
    }

    // Add class IDs (JSON array) - only if doesn't exist
    if (!columnExists('classIds')) {
      await queryRunner.addColumn(
        'fee_generation_history',
        new TableColumn({
          name: 'classIds',
          type: 'json',
          isNullable: true,
        }),
      );
    }

    // Add student IDs (JSON array) - only if doesn't exist
    if (!columnExists('studentIds')) {
      await queryRunner.addColumn(
        'fee_generation_history',
        new TableColumn({
          name: 'studentIds',
          type: 'json',
          isNullable: true,
        }),
      );
    }

    // Add total amount generated - only if doesn't exist
    if (!columnExists('totalAmountGenerated')) {
      await queryRunner.addColumn(
        'fee_generation_history',
        new TableColumn({
          name: 'totalAmountGenerated',
          type: 'decimal',
          precision: 15,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    // Add failed student details (JSON array) - only if doesn't exist
    if (!columnExists('failedStudentDetails')) {
      await queryRunner.addColumn(
        'fee_generation_history',
        new TableColumn({
          name: 'failedStudentDetails',
          type: 'json',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('fee_generation_history', 'failedStudentDetails');
    await queryRunner.dropColumn('fee_generation_history', 'totalAmountGenerated');
    await queryRunner.dropColumn('fee_generation_history', 'studentIds');
    await queryRunner.dropColumn('fee_generation_history', 'classIds');
    await queryRunner.dropColumn('fee_generation_history', 'feeStructureIds');
  }
}

