import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserRolesTable1767422575558 implements MigrationInterface {
    name = 'CreateUserRolesTable1767422575558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Create user_roles table if it doesn't exist
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_roles'
            )
        `);
        
        if (!tableExists[0].exists) {
            await queryRunner.query(`
                CREATE TABLE "user_roles" (
                    "id" SERIAL NOT NULL,
                    "name" character varying(50) NOT NULL,
                    "displayName" character varying(100),
                    "description" text,
                    "isActive" boolean NOT NULL DEFAULT true,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "UQ_user_roles_name" UNIQUE ("name"),
                    CONSTRAINT "PK_user_roles" PRIMARY KEY ("id")
                )
            `);
        }

        // Step 2: Insert initial roles if they don't exist
        const rolesExist = await queryRunner.query(`
            SELECT COUNT(*)::int as count FROM "user_roles"
        `);
        
        if (rolesExist[0].count === 0) {
            await queryRunner.query(`
                INSERT INTO "user_roles" ("name", "displayName", "description", "isActive") VALUES
                ('super_admin', 'Super Admin', 'Super administrator with full system access', true),
                ('administrator', 'Administrator', 'School administrator', true),
                ('accountant', 'Accountant', 'School accountant', true),
                ('student', 'Student', 'Student user', true),
                ('parent', 'Parent', 'Parent user', true)
            `);
        }

        // Step 3: Add roleId column to users table if it doesn't exist
        const roleIdColumnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'roleId'
            )
        `);
        
        if (!roleIdColumnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "users" ADD "roleId" integer`);
        }

        // Step 4: Migrate existing enum data to roleId (only if role column still exists)
        const roleColumnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'role'
            )
        `);
        
        if (roleColumnExists[0].exists) {
            await queryRunner.query(`
                UPDATE "users" SET "roleId" = (
                    SELECT "id" FROM "user_roles" 
                    WHERE "user_roles"."name" = CAST("users"."role" AS TEXT)
                )
                WHERE "roleId" IS NULL
            `);
        }

        // Step 5: Add foreign key constraint if it doesn't exist
        const fkExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND constraint_name = 'FK_users_roleId'
            )
        `);
        
        if (!fkExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD CONSTRAINT "FK_users_roleId" 
                FOREIGN KEY ("roleId") 
                REFERENCES "user_roles"("id") 
                ON DELETE NO ACTION 
                ON UPDATE NO ACTION
            `);
        }

        // Step 6: Drop the old enum column if it exists
        if (roleColumnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Recreate enum type
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'administrator', 'accountant', 'student', 'parent')
        `);

        // Step 2: Add role column back
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "role" "public"."users_role_enum" NOT NULL DEFAULT 'student'
        `);

        // Step 3: Migrate data back from roleId to role
        await queryRunner.query(`
            UPDATE "users" SET "role" = (
                SELECT "name"::"users_role_enum" FROM "user_roles" WHERE "user_roles"."id" = "users"."roleId"
            )
        `);

        // Step 4: Drop foreign key and roleId column
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_roleId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "roleId"`);

        // Step 5: Drop user_roles table
        await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    }
}
