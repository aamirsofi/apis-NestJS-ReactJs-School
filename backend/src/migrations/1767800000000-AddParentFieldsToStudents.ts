import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddParentFieldsToStudents1767800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add father fields
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'fatherName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'fatherContact',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add mother fields
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'motherName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'motherContact',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add guardian fields
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'guardianName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'guardianContact',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add previous school fields
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'previousClass',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'previousSchoolName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('students', 'previousSchoolName');
    await queryRunner.dropColumn('students', 'previousClass');
    await queryRunner.dropColumn('students', 'guardianContact');
    await queryRunner.dropColumn('students', 'guardianName');
    await queryRunner.dropColumn('students', 'motherContact');
    await queryRunner.dropColumn('students', 'motherName');
    await queryRunner.dropColumn('students', 'fatherContact');
    await queryRunner.dropColumn('students', 'fatherName');
  }
}

