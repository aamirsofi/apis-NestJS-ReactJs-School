import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPeriodFieldsToFeeInvoices1769100000000 implements MigrationInterface {
  // Helper function to check if column exists
  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return false;
    return table.columns.some(column => column.name === columnName);
  }

  // Helper function to check if index exists
  private async indexExists(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return false;
    return table.indices.some(index => index.name === indexName);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add period tracking columns (only if they don't exist)
    if (!(await this.columnExists(queryRunner, 'fee_invoices', 'periodMonth'))) {
      await queryRunner.addColumn(
        'fee_invoices',
        new TableColumn({
          name: 'periodMonth',
          type: 'int',
          isNullable: true,
          comment: 'Month (1-12) for monthly invoices',
        }),
      );
    }

    if (!(await this.columnExists(queryRunner, 'fee_invoices', 'periodQuarter'))) {
      await queryRunner.addColumn(
        'fee_invoices',
        new TableColumn({
          name: 'periodQuarter',
          type: 'int',
          isNullable: true,
          comment: 'Quarter (1-4) for quarterly invoices',
        }),
      );
    }

    if (!(await this.columnExists(queryRunner, 'fee_invoices', 'periodYear'))) {
      await queryRunner.addColumn(
        'fee_invoices',
        new TableColumn({
          name: 'periodYear',
          type: 'int',
          isNullable: true,
          comment: 'Year for the period',
        }),
      );
    }

    // Create unique index to prevent duplicate invoices for same student + period + type
    // Note: PostgreSQL doesn't support partial unique indexes with WHERE clause in TypeORM migrations easily
    // We'll create a regular unique index and handle the logic in the application
    if (!(await this.indexExists(queryRunner, 'fee_invoices', 'IDX_fee_invoices_student_period_unique'))) {
      await queryRunner.createIndex(
        'fee_invoices',
        new TableIndex({
          name: 'IDX_fee_invoices_student_period_unique',
          columnNames: ['schoolId', 'studentId', 'academicYearId', 'type', 'periodMonth', 'periodQuarter', 'periodYear'],
          isUnique: false, // We'll handle uniqueness in application logic since we need conditional uniqueness
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index (only if exists)
    if (await this.indexExists(queryRunner, 'fee_invoices', 'IDX_fee_invoices_student_period_unique')) {
      await queryRunner.dropIndex('fee_invoices', 'IDX_fee_invoices_student_period_unique');
    }

    // Drop columns (only if exist)
    if (await this.columnExists(queryRunner, 'fee_invoices', 'periodYear')) {
      await queryRunner.dropColumn('fee_invoices', 'periodYear');
    }
    if (await this.columnExists(queryRunner, 'fee_invoices', 'periodQuarter')) {
      await queryRunner.dropColumn('fee_invoices', 'periodQuarter');
    }
    if (await this.columnExists(queryRunner, 'fee_invoices', 'periodMonth')) {
      await queryRunner.dropColumn('fee_invoices', 'periodMonth');
    }
  }
}

