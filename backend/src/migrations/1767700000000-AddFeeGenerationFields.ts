import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddFeeGenerationFields1767700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to student_fee_structures table
    const studentFeeStructuresTable = await queryRunner.getTable('student_fee_structures');
    
    if (studentFeeStructuresTable) {
      // Check and add originalAmount column
      if (!studentFeeStructuresTable.findColumnByName('originalAmount')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'originalAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }));
      }

      // Check and add discountAmount column
      if (!studentFeeStructuresTable.findColumnByName('discountAmount')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'discountAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
        }));
      }

      // Check and add discountPercentage column
      if (!studentFeeStructuresTable.findColumnByName('discountPercentage')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'discountPercentage',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
        }));
      }

      // Check and add installmentStartDate column
      if (!studentFeeStructuresTable.findColumnByName('installmentStartDate')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'installmentStartDate',
          type: 'date',
          isNullable: true,
        }));
      }

      // Check and add installmentCount column
      if (!studentFeeStructuresTable.findColumnByName('installmentCount')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'installmentCount',
          type: 'int',
          isNullable: true,
        }));
      }

      // Check and add installmentNumber column
      if (!studentFeeStructuresTable.findColumnByName('installmentNumber')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'installmentNumber',
          type: 'int',
          isNullable: true,
        }));
      }

      // Check and add installmentAmount column
      if (!studentFeeStructuresTable.findColumnByName('installmentAmount')) {
        await queryRunner.addColumn('student_fee_structures', new TableColumn({
          name: 'installmentAmount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }));
      }
    }

    // Create fee_generation_history table
    const feeGenerationHistoryTable = await queryRunner.getTable('fee_generation_history');
    if (!feeGenerationHistoryTable) {
      await queryRunner.createTable(
        new Table({
          name: 'fee_generation_history',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'type',
              type: 'enum',
              enum: ['manual', 'automatic'],
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['pending', 'in_progress', 'completed', 'failed'],
              default: "'pending'",
            },
            {
              name: 'schoolId',
              type: 'int',
            },
            {
              name: 'academicYearId',
              type: 'int',
            },
            {
              name: 'totalStudents',
              type: 'int',
            },
            {
              name: 'feesGenerated',
              type: 'int',
              default: 0,
            },
            {
              name: 'feesFailed',
              type: 'int',
              default: 0,
            },
            {
              name: 'errorMessage',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'generatedByUserId',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'generatedBy',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      // Add foreign keys
      await queryRunner.createForeignKey(
        'fee_generation_history',
        new TableForeignKey({
          columnNames: ['schoolId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'schools',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'fee_generation_history',
        new TableForeignKey({
          columnNames: ['academicYearId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'academic_years',
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop fee_generation_history table
    const feeGenerationHistoryTable = await queryRunner.getTable('fee_generation_history');
    if (feeGenerationHistoryTable) {
      await queryRunner.dropTable('fee_generation_history');
    }

    // Remove columns from student_fee_structures table
    const studentFeeStructuresTable = await queryRunner.getTable('student_fee_structures');
    if (studentFeeStructuresTable) {
      const columnsToRemove = [
        'installmentAmount',
        'installmentNumber',
        'installmentCount',
        'installmentStartDate',
        'discountPercentage',
        'discountAmount',
        'originalAmount',
      ];

      for (const columnName of columnsToRemove) {
        if (studentFeeStructuresTable.findColumnByName(columnName)) {
          await queryRunner.dropColumn('student_fee_structures', columnName);
        }
      }
    }
  }
}


