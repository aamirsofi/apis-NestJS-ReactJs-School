import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsAndAnnouncements1767374586810 implements MigrationInterface {
    name = 'CreateNotificationsAndAnnouncements1767374586810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('info', 'success', 'warning', 'error', 'payment', 'fee_due', 'announcement')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('unread', 'read', 'archived')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'info', "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread', "link" character varying, "icon" character varying, "userId" integer, "schoolId" integer, "isBroadcast" boolean NOT NULL DEFAULT false, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."announcements_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."announcements_status_enum" AS ENUM('draft', 'published', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."announcements_target_enum" AS ENUM('all', 'students', 'parents', 'teachers', 'administrators')`);
        await queryRunner.query(`CREATE TABLE "announcements" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "priority" "public"."announcements_priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."announcements_status_enum" NOT NULL DEFAULT 'draft', "target" "public"."announcements_target_enum" NOT NULL DEFAULT 'all', "publishAt" TIMESTAMP, "expiresAt" TIMESTAMP, "sendEmail" boolean NOT NULL DEFAULT false, "sendSMS" boolean NOT NULL DEFAULT false, "createdById" integer NOT NULL, "schoolId" integer NOT NULL, "attachments" jsonb, "views" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d083b12a7a95fad122be85a4ac9" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_197a06ce0989e489974fdc26ca8" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_e49fae0393356ec4eb6f12e5d91" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_e49fae0393356ec4eb6f12e5d91"`);
        await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_197a06ce0989e489974fdc26ca8"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d083b12a7a95fad122be85a4ac9"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`DROP TABLE "announcements"`);
        await queryRunner.query(`DROP TYPE "public"."announcements_target_enum"`);
        await queryRunner.query(`DROP TYPE "public"."announcements_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."announcements_priority_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
