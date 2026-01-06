import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migration to add polymorphic source support to fee_invoice_items
 * This allows invoice items to reference different source types:
 * - FEE (fee_structure)
 * - TRANSPORT (route_price)
 * - HOSTEL (hostel_plan - if exists)
 * - FINE (fine - if exists)
 * - MISC (misc_charge - if exists)
 */
export class AddPolymorphicSourceToFeeInvoiceItems1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for source types
    await queryRunner.query(`
      CREATE TYPE fee_invoice_item_source_type_enum AS ENUM (
        'FEE',
        'TRANSPORT',
        'HOSTEL',
        'FINE',
        'MISC'
      );
    `);

    // Add sourceType column
    await queryRunner.addColumn(
      'fee_invoice_items',
      new TableColumn({
        name: 'sourceType',
        type: 'fee_invoice_item_source_type_enum',
        isNullable: true, // Nullable for backward compatibility with existing data
      }),
    );

    // Add sourceId column
    await queryRunner.addColumn(
      'fee_invoice_items',
      new TableColumn({
        name: 'sourceId',
        type: 'integer',
        isNullable: true, // Nullable for backward compatibility with existing data
      }),
    );

    // Create composite index for polymorphic lookups
    await queryRunner.createIndex(
      'fee_invoice_items',
      new TableIndex({
        name: 'IDX_fee_invoice_items_source',
        columnNames: ['sourceType', 'sourceId'],
      }),
    );

    // Migrate existing data: set sourceType='FEE' and sourceId=feeStructureId where feeStructureId is not null
    await queryRunner.query(`
      UPDATE fee_invoice_items
      SET "sourceType" = 'FEE', "sourceId" = "feeStructureId"
      WHERE "feeStructureId" IS NOT NULL;
    `);

    // Add metadata columns for audit trail
    await queryRunner.addColumn(
      'fee_invoice_items',
      new TableColumn({
        name: 'sourceMetadata',
        type: 'jsonb',
        isNullable: true,
        comment: 'Snapshot of source data at invoice creation time for audit trail',
      }),
    );

    // Add check constraint to ensure either (sourceType AND sourceId) or neither
    await queryRunner.query(`
      ALTER TABLE fee_invoice_items
      ADD CONSTRAINT chk_source_type_and_id
      CHECK (
        ("sourceType" IS NOT NULL AND "sourceId" IS NOT NULL) OR
        ("sourceType" IS NULL AND "sourceId" IS NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE fee_invoice_items
      DROP CONSTRAINT IF EXISTS chk_source_type_and_id;
    `);

    // Drop columns
    await queryRunner.dropColumn('fee_invoice_items', 'sourceMetadata');
    await queryRunner.dropIndex('fee_invoice_items', 'IDX_fee_invoice_items_source');
    await queryRunner.dropColumn('fee_invoice_items', 'sourceId');
    await queryRunner.dropColumn('fee_invoice_items', 'sourceType');

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS fee_invoice_item_source_type_enum;`);
  }
}

