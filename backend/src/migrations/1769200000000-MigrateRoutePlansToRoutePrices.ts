import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateRoutePlansToRoutePrices1769200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Migrate route_plans with both classId and categoryHeadId set
    await queryRunner.query(`
      INSERT INTO route_prices ("schoolId", "routeId", "classId", "categoryHeadId", amount, status, "createdAt", "updatedAt")
      SELECT 
        rp."schoolId",
        rp."routeId",
        rp."classId",
        rp."categoryHeadId",
        rp.amount,
        (CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END)::route_prices_status_enum,
        rp."createdAt",
        rp."updatedAt"
      FROM route_plans rp
      WHERE rp."classId" IS NOT NULL
        AND rp."categoryHeadId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM route_prices rp2
          WHERE rp2."schoolId" = rp."schoolId"
            AND rp2."routeId" = rp."routeId"
            AND rp2."classId" = rp."classId"
            AND rp2."categoryHeadId" = rp."categoryHeadId"
        )
    `);

    // Step 2: Migrate route_plans with NULL classId (create for all classes)
    await queryRunner.query(`
      INSERT INTO route_prices ("schoolId", "routeId", "classId", "categoryHeadId", amount, status, "createdAt", "updatedAt")
      SELECT DISTINCT
        rp."schoolId",
        rp."routeId",
        c.id as "classId",
        rp."categoryHeadId",
        rp.amount,
        (CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END)::route_prices_status_enum,
        rp."createdAt",
        rp."updatedAt"
      FROM route_plans rp
      CROSS JOIN classes c
      WHERE rp."classId" IS NULL
        AND rp."categoryHeadId" IS NOT NULL
        AND c."schoolId" = rp."schoolId"
        AND c.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM route_prices rp2
          WHERE rp2."schoolId" = rp."schoolId"
            AND rp2."routeId" = rp."routeId"
            AND rp2."classId" = c.id
            AND rp2."categoryHeadId" = rp."categoryHeadId"
        )
    `);

    // Step 3: Migrate route_plans with NULL categoryHeadId (create for all category heads)
    await queryRunner.query(`
      INSERT INTO route_prices ("schoolId", "routeId", "classId", "categoryHeadId", amount, status, "createdAt", "updatedAt")
      SELECT DISTINCT
        rp."schoolId",
        rp."routeId",
        rp."classId",
        ch.id as "categoryHeadId",
        rp.amount,
        (CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END)::route_prices_status_enum,
        rp."createdAt",
        rp."updatedAt"
      FROM route_plans rp
      CROSS JOIN category_heads ch
      WHERE rp."classId" IS NOT NULL
        AND rp."categoryHeadId" IS NULL
        AND ch."schoolId" = rp."schoolId"
        AND ch.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM route_prices rp2
          WHERE rp2."schoolId" = rp."schoolId"
            AND rp2."routeId" = rp."routeId"
            AND rp2."classId" = rp."classId"
            AND rp2."categoryHeadId" = ch.id
        )
    `);

    // Step 4: Migrate route_plans with both NULL (create for all class × category head combinations)
    await queryRunner.query(`
      INSERT INTO route_prices ("schoolId", "routeId", "classId", "categoryHeadId", amount, status, "createdAt", "updatedAt")
      SELECT DISTINCT
        rp."schoolId",
        rp."routeId",
        c.id as "classId",
        ch.id as "categoryHeadId",
        rp.amount,
        (CASE WHEN rp.status = 'active' THEN 'active' ELSE 'inactive' END)::route_prices_status_enum,
        rp."createdAt",
        rp."updatedAt"
      FROM route_plans rp
      CROSS JOIN classes c
      CROSS JOIN category_heads ch
      WHERE rp."classId" IS NULL
        AND rp."categoryHeadId" IS NULL
        AND c."schoolId" = rp."schoolId"
        AND c.status = 'active'
        AND ch."schoolId" = rp."schoolId"
        AND ch.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM route_prices rp2
          WHERE rp2."schoolId" = rp."schoolId"
            AND rp2."routeId" = rp."routeId"
            AND rp2."classId" = c.id
            AND rp2."categoryHeadId" = ch.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Delete route_prices that were created from route_plans
    // Note: This is a conservative rollback - only deletes entries that match route_plans
    // Custom route_prices created after migration will be preserved
    
    await queryRunner.query(`
      DELETE FROM route_prices rp
      WHERE EXISTS (
        SELECT 1 FROM route_plans rp2
        WHERE rp2."schoolId" = rp."schoolId"
          AND rp2."routeId" = rp."routeId"
          AND (
            (rp2."classId" IS NOT NULL AND rp."classId" = rp2."classId")
            OR (rp2."classId" IS NULL)
          )
          AND (
            (rp2."categoryHeadId" IS NOT NULL AND rp."categoryHeadId" = rp2."categoryHeadId")
            OR (rp2."categoryHeadId" IS NULL)
          )
          AND rp.amount = rp2.amount
      )
    `);
  }
}

