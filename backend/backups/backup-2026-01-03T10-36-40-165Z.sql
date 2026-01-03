-- PostgreSQL database backup
-- Generated: 2026-01-03T10:36:40.365Z
-- Database: fee_management

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- Table: academic_years
DROP TABLE IF EXISTS "academic_years" CASCADE;
CREATE TABLE "academic_years" (
  "id" integer NOT NULL DEFAULT nextval('academic_years_id_seq'::regclass),
  "name" character varying(50) NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "isCurrent" boolean NOT NULL DEFAULT false,
  "description" text,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: academic_years
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (1, '2024-2025', '2023-12-31T18:30:00.000Z', '2025-12-30T18:30:00.000Z', false, '', 3, '2025-12-31T14:15:21.857Z', '2025-12-31T14:15:21.857Z');
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (2, '2025-2026', '2024-12-31T18:30:00.000Z', '2026-12-30T18:30:00.000Z', true, '', 3, '2025-12-31T14:15:50.702Z', '2025-12-31T14:15:50.702Z');
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (3, '2024-2025', '2023-12-31T18:30:00.000Z', '2025-12-30T18:30:00.000Z', false, '', 9, '2025-12-31T14:20:50.490Z', '2025-12-31T14:20:50.490Z');
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (4, '2025-2026', '2024-12-31T18:30:00.000Z', '2026-12-30T18:30:00.000Z', true, '', 9, '2025-12-31T14:21:10.133Z', '2025-12-31T14:21:10.133Z');
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (5, '2025-2026', '2025-03-30T18:30:00.000Z', '2026-03-29T18:30:00.000Z', true, NULL, 8, '2026-01-02T00:30:41.616Z', '2026-01-02T00:30:41.616Z');
INSERT INTO "academic_years" ("id", "name", "startDate", "endDate", "isCurrent", "description", "schoolId", "createdAt", "updatedAt") VALUES (6, '2026-2027', '2025-12-31T18:30:00.000Z', '2027-12-30T18:30:00.000Z', false, '', 9, '2026-01-02T00:33:40.649Z', '2026-01-02T00:33:40.649Z');


-- Table: announcements
DROP TABLE IF EXISTS "announcements" CASCADE;
CREATE TABLE "announcements" (
  "id" integer NOT NULL DEFAULT nextval('announcements_id_seq'::regclass),
  "title" character varying NOT NULL,
  "content" text NOT NULL,
  "priority" USER-DEFINED NOT NULL DEFAULT 'medium'::announcements_priority_enum,
  "status" USER-DEFINED NOT NULL DEFAULT 'draft'::announcements_status_enum,
  "target" USER-DEFINED NOT NULL DEFAULT 'all'::announcements_target_enum,
  "publishAt" timestamp without time zone,
  "expiresAt" timestamp without time zone,
  "sendEmail" boolean NOT NULL DEFAULT false,
  "sendSMS" boolean NOT NULL DEFAULT false,
  "createdById" integer NOT NULL,
  "schoolId" integer NOT NULL,
  "attachments" jsonb,
  "views" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: announcements
INSERT INTO "announcements" ("id", "title", "content", "priority", "status", "target", "publishAt", "expiresAt", "sendEmail", "sendSMS", "createdById", "schoolId", "attachments", "views", "createdAt", "updatedAt") VALUES (3, 'eterte', 'tretertretert', 'medium', 'published', 'administrators', '2026-01-03T06:03:18.948Z', '2026-01-03T06:03:18.948Z', false, false, 4, 9, NULL, 0, '2026-01-03T06:03:18.948Z', '2026-01-03T06:03:18.948Z');
INSERT INTO "announcements" ("id", "title", "content", "priority", "status", "target", "publishAt", "expiresAt", "sendEmail", "sendSMS", "createdById", "schoolId", "attachments", "views", "createdAt", "updatedAt") VALUES (4, 'sdfsdf', 'dsfsdfsdfsdf', 'medium', 'draft', 'all', '2026-01-03T06:22:00.000Z', '2026-01-03T06:22:00.000Z', false, false, 4, 9, NULL, 0, '2026-01-03T00:52:46.809Z', '2026-01-03T00:52:46.809Z');


-- Table: category_heads
DROP TABLE IF EXISTS "category_heads" CASCADE;
CREATE TABLE "category_heads" (
  "id" integer NOT NULL DEFAULT nextval('category_heads_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "description" text,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::category_heads_status_enum,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: category_heads
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (1, 'General', NULL, 'active', 3, '2025-12-31T02:16:47.709Z', '2025-12-31T02:16:47.709Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (2, 'General', NULL, 'active', 5, '2025-12-31T03:40:34.417Z', '2025-12-31T03:40:34.417Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (3, 'General', 'General category head', 'active', 6, '2025-12-31T04:47:03.292Z', '2025-12-31T04:47:03.292Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (4, 'Sponsored', 'Sponsored category head', 'active', 6, '2025-12-31T04:47:03.335Z', '2025-12-31T04:47:03.335Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (5, 'General', 'General category head', 'active', 7, '2025-12-31T04:47:18.425Z', '2025-12-31T04:47:18.425Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (6, 'Sponsored', 'Sponsored category head', 'active', 7, '2025-12-31T04:47:18.501Z', '2025-12-31T04:47:18.501Z');
INSERT INTO "category_heads" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (7, 'General', 'General category head for miscellaneous fees', 'active', 9, '2025-12-31T11:08:15.763Z', '2025-12-31T11:08:15.763Z');


-- Table: classes
DROP TABLE IF EXISTS "classes" CASCADE;
CREATE TABLE "classes" (
  "id" integer NOT NULL DEFAULT nextval('classes_id_seq'::regclass),
  "schoolId" integer NOT NULL,
  "name" character varying(255) NOT NULL,
  "description" text,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::classes_status_enum,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: classes
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (1, 3, 'Ist', 'First grade class', 'active', '2025-12-31T02:18:32.944Z', '2025-12-31T02:18:32.944Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (2, 3, '2nd', NULL, 'active', '2025-12-31T02:18:32.989Z', '2025-12-31T02:18:32.989Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (3, 3, '3rd', NULL, 'active', '2025-12-31T02:18:33.018Z', '2025-12-31T02:18:33.018Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (4, 5, 'Ist', NULL, 'active', '2025-12-31T03:41:02.661Z', '2025-12-31T03:41:02.661Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (5, 5, '2nd', NULL, 'active', '2025-12-31T03:41:06.816Z', '2025-12-31T03:41:06.816Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (6, 5, '3rd', NULL, 'active', '2025-12-31T03:41:10.532Z', '2025-12-31T03:41:10.532Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (7, 5, '4th', NULL, 'active', '2025-12-31T03:41:13.456Z', '2025-12-31T03:41:13.456Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (8, 9, '1st', NULL, 'active', '2025-12-31T11:08:15.785Z', '2025-12-31T11:08:15.785Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (9, 9, '2nd', NULL, 'active', '2025-12-31T11:08:15.805Z', '2025-12-31T11:08:15.805Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (10, 9, '3rd', NULL, 'active', '2025-12-31T11:08:15.825Z', '2025-12-31T11:08:15.825Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (11, 9, '4th', NULL, 'active', '2025-12-31T11:08:15.849Z', '2025-12-31T11:08:15.849Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (12, 9, '5th', NULL, 'active', '2025-12-31T11:08:15.872Z', '2025-12-31T11:08:15.872Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (13, 9, '6th', NULL, 'active', '2025-12-31T11:08:15.899Z', '2025-12-31T11:08:15.899Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (14, 9, '7th', NULL, 'active', '2025-12-31T11:08:15.922Z', '2025-12-31T11:08:15.922Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (15, 9, '8th', NULL, 'active', '2025-12-31T11:08:15.947Z', '2025-12-31T11:08:15.947Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (16, 9, '9th', NULL, 'active', '2025-12-31T11:08:15.970Z', '2025-12-31T11:08:15.970Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (17, 9, '10th', NULL, 'active', '2025-12-31T11:08:15.994Z', '2025-12-31T11:08:15.994Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (18, 9, '11th', NULL, 'active', '2025-12-31T11:08:16.017Z', '2025-12-31T11:08:16.017Z');
INSERT INTO "classes" ("id", "schoolId", "name", "description", "status", "createdAt", "updatedAt") VALUES (19, 9, '12th', NULL, 'active', '2025-12-31T11:08:16.043Z', '2025-12-31T11:08:16.043Z');


-- Table: fee_categories
DROP TABLE IF EXISTS "fee_categories" CASCADE;
CREATE TABLE "fee_categories" (
  "id" integer NOT NULL DEFAULT nextval('fee_categories_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "description" text,
  "type" USER-DEFINED NOT NULL DEFAULT 'school'::fee_categories_type_enum,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::fee_categories_status_enum,
  "applicableMonths" json,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: fee_categories
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (4, 'Tuition Fee', 'Monthly tuition fee', 'school', 'active', 1,2, 5, '2025-12-31T03:39:10.861Z', '2025-12-31T05:19:27.567Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (3, 'Transport', NULL, 'school', 'active', 7,10, 3, '2025-12-31T02:16:34.429Z', '2025-12-31T05:19:36.835Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (1, 'Tuition Fee', 'Monthly tuition fee', 'school', 'active', 8,12, 3, '2025-12-31T02:16:34.310Z', '2025-12-31T05:19:44.140Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (2, 'Hostal', NULL, 'school', 'active', 5,11, 3, '2025-12-31T02:16:34.375Z', '2025-12-31T05:19:55.167Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (5, 'Transport Gee', NULL, 'transport', 'active', , 3, '2025-12-31T08:20:51.560Z', '2025-12-31T08:20:51.560Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (6, 'Tuition Fee', 'Monthly tuition fee', 'school', 'active', NULL, 9, '2025-12-31T11:08:15.627Z', '2025-12-31T11:08:15.627Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (7, 'Transport Fee', 'Transportation fee', 'transport', 'active', NULL, 9, '2025-12-31T11:08:15.644Z', '2025-12-31T11:08:15.644Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (8, 'Library Fee', 'Library and reading materials fee', 'school', 'active', NULL, 9, '2025-12-31T11:08:15.665Z', '2025-12-31T11:08:15.665Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (9, 'Sports Fee', 'Sports and physical education fee', 'school', 'active', NULL, 9, '2025-12-31T11:08:15.690Z', '2025-12-31T11:08:15.690Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (10, 'Lab Fee', 'Laboratory and practical fee', 'school', 'active', NULL, 9, '2025-12-31T11:08:15.715Z', '2025-12-31T11:08:15.715Z');
INSERT INTO "fee_categories" ("id", "name", "description", "type", "status", "applicableMonths", "schoolId", "createdAt", "updatedAt") VALUES (11, 'Examination Fee', 'Examination and assessment fee', 'school', 'active', NULL, 9, '2025-12-31T11:08:15.738Z', '2025-12-31T11:08:15.738Z');


-- Table: fee_structures
DROP TABLE IF EXISTS "fee_structures" CASCADE;
CREATE TABLE "fee_structures" (
  "id" integer NOT NULL DEFAULT nextval('fee_structures_id_seq'::regclass),
  "feeCategoryId" integer NOT NULL,
  "categoryHeadId" integer,
  "name" character varying(255) NOT NULL,
  "description" text,
  "amount" numeric NOT NULL,
  "academicYear" character varying(255),
  "dueDate" date,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::fee_structures_status_enum,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  "classId" integer
);

-- Data for table: fee_structures
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (45, 1, 1, 'Tuition Fee - General (2nd)', NULL, '150.00', NULL, NULL, 'active', 3, '2025-12-31T03:38:35.303Z', '2025-12-31T03:38:35.303Z', 2);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (46, 1, 1, 'Tuition Fee - General (3rd)', NULL, '150.00', NULL, NULL, 'active', 3, '2025-12-31T03:38:35.349Z', '2025-12-31T03:38:35.349Z', 3);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (47, 1, 1, 'Tuition Fee - General (Ist)', NULL, '150.00', NULL, NULL, 'active', 3, '2025-12-31T03:38:35.394Z', '2025-12-31T03:38:35.394Z', 1);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (48, 4, 2, 'Tuition Fee - General (Ist)', NULL, '121.00', NULL, NULL, 'active', 5, '2025-12-31T03:41:33.169Z', '2025-12-31T03:41:33.169Z', 4);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (49, 4, 2, 'Tuition Fee - General (2nd)', NULL, '23.00', NULL, NULL, 'active', 5, '2025-12-31T03:41:42.946Z', '2025-12-31T03:41:42.946Z', 5);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (50, 4, 2, 'Tuition Fee - General (3rd)', NULL, '23.00', NULL, NULL, 'active', 5, '2025-12-31T03:41:42.983Z', '2025-12-31T03:41:42.983Z', 6);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (51, 4, 2, 'Tuition Fee - General (4th)', NULL, '23.00', NULL, NULL, 'active', 5, '2025-12-31T03:41:43.017Z', '2025-12-31T03:41:43.017Z', 7);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (52, 11, 7, 'Examination Fee - General (10th)', NULL, '300.00', NULL, NULL, 'active', 9, '2026-01-02T04:35:48.808Z', '2026-01-02T04:35:48.808Z', 17);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (53, 11, 7, 'Examination Fee - General (11th)', NULL, '300.00', NULL, NULL, 'active', 9, '2026-01-02T04:35:48.852Z', '2026-01-02T04:35:48.852Z', 18);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (54, 10, 7, 'Lab Fee - General (10th)', NULL, '300.00', NULL, NULL, 'active', 9, '2026-01-02T04:35:48.888Z', '2026-01-02T04:35:48.888Z', 17);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (55, 10, 7, 'Lab Fee - General (11th)', NULL, '300.00', NULL, NULL, 'active', 9, '2026-01-02T04:35:48.928Z', '2026-01-02T04:35:48.928Z', 18);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (56, 9, 7, 'Sports Fee - General (10th)', NULL, '12.00', NULL, NULL, 'active', 9, '2026-01-02T05:40:32.856Z', '2026-01-02T05:40:32.856Z', 17);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (57, 8, 7, 'Library Fee - General (10th)', NULL, '12.00', NULL, NULL, 'active', 9, '2026-01-02T05:40:32.908Z', '2026-01-02T05:40:32.908Z', 17);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (58, 7, 7, 'Transport Fee - General (10th)', NULL, '12.00', NULL, NULL, 'active', 9, '2026-01-02T05:40:32.944Z', '2026-01-02T05:40:32.944Z', 17);
INSERT INTO "fee_structures" ("id", "feeCategoryId", "categoryHeadId", "name", "description", "amount", "academicYear", "dueDate", "status", "schoolId", "createdAt", "updatedAt", "classId") VALUES (59, 6, 7, 'Tuition Fee - General (10th)', NULL, '12.00', NULL, NULL, 'active', 9, '2026-01-02T05:40:32.982Z', '2026-01-02T05:40:32.982Z', 17);


-- Table: migrations
DROP TABLE IF EXISTS "migrations" CASCADE;
CREATE TABLE "migrations" (
  "id" integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL
);

-- Data for table: migrations
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (1, '1767259140968', 'AddSchoolIdToStudentAcademicRecords1767259140968');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (2, '1767374586810', 'CreateNotificationsAndAnnouncements1767374586810');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (3, '1767422575558', 'CreateUserRolesTable1767422575558');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (4, '1767500000000', 'CreateSettingsTable1767500000000');


-- Table: notifications
DROP TABLE IF EXISTS "notifications" CASCADE;
CREATE TABLE "notifications" (
  "id" integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  "title" character varying NOT NULL,
  "message" text NOT NULL,
  "type" USER-DEFINED NOT NULL DEFAULT 'info'::notifications_type_enum,
  "status" USER-DEFINED NOT NULL DEFAULT 'unread'::notifications_status_enum,
  "link" character varying,
  "icon" character varying,
  "userId" integer,
  "schoolId" integer,
  "isBroadcast" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);


-- Table: payments
DROP TABLE IF EXISTS "payments" CASCADE;
CREATE TABLE "payments" (
  "id" integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  "studentId" integer NOT NULL,
  "feeStructureId" integer NOT NULL,
  "amount" numeric NOT NULL,
  "paymentDate" date NOT NULL,
  "paymentMethod" USER-DEFINED NOT NULL DEFAULT 'cash'::payments_paymentmethod_enum,
  "transactionId" character varying(255),
  "status" USER-DEFINED NOT NULL DEFAULT 'pending'::payments_status_enum,
  "notes" text,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);


-- Table: route_plans
DROP TABLE IF EXISTS "route_plans" CASCADE;
CREATE TABLE "route_plans" (
  "id" integer NOT NULL DEFAULT nextval('route_plans_id_seq'::regclass),
  "routeId" integer NOT NULL,
  "feeCategoryId" integer NOT NULL,
  "categoryHeadId" integer,
  "classId" integer,
  "name" character varying(255) NOT NULL,
  "description" text,
  "amount" numeric NOT NULL,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::route_plans_status_enum,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: route_plans
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (1, 1, 5, 1, 1, 'FREE - Transport Gee - General (Ist)', NULL, '2300.00', 'active', 3, '2025-12-31T08:23:51.258Z', '2025-12-31T08:23:51.258Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (2, 4, 7, 7, 17, 'FREE - Transport Fee - General (10th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:00.823Z', '2026-01-02T05:40:00.823Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (3, 4, 7, 7, 18, 'FREE - Transport Fee - General (11th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:00.868Z', '2026-01-02T05:40:00.868Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (4, 4, 7, 7, 19, 'FREE - Transport Fee - General (12th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:00.902Z', '2026-01-02T05:40:00.902Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (5, 4, 7, 7, 8, 'FREE - Transport Fee - General (1st)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:00.944Z', '2026-01-02T05:40:00.944Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (6, 4, 7, 7, 9, 'FREE - Transport Fee - General (2nd)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:00.978Z', '2026-01-02T05:40:00.978Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (7, 4, 7, 7, 10, 'FREE - Transport Fee - General (3rd)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.014Z', '2026-01-02T05:40:01.014Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (8, 4, 7, 7, 11, 'FREE - Transport Fee - General (4th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.048Z', '2026-01-02T05:40:01.048Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (9, 4, 7, 7, 12, 'FREE - Transport Fee - General (5th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.078Z', '2026-01-02T05:40:01.078Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (10, 4, 7, 7, 13, 'FREE - Transport Fee - General (6th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.117Z', '2026-01-02T05:40:01.117Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (11, 4, 7, 7, 14, 'FREE - Transport Fee - General (7th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.157Z', '2026-01-02T05:40:01.157Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (12, 4, 7, 7, 15, 'FREE - Transport Fee - General (8th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.188Z', '2026-01-02T05:40:01.188Z');
INSERT INTO "route_plans" ("id", "routeId", "feeCategoryId", "categoryHeadId", "classId", "name", "description", "amount", "status", "schoolId", "createdAt", "updatedAt") VALUES (13, 4, 7, 7, 16, 'FREE - Transport Fee - General (9th)', NULL, '0.00', 'active', 9, '2026-01-02T05:40:01.220Z', '2026-01-02T05:40:01.220Z');


-- Table: routes
DROP TABLE IF EXISTS "routes" CASCADE;
CREATE TABLE "routes" (
  "id" integer NOT NULL DEFAULT nextval('routes_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "description" text,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::routes_status_enum,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: routes
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (2, 'Route 300', 'Safapora, Pehlipora, MirMohalla', 'active', 3, '2025-12-31T07:57:51.215Z', '2025-12-31T07:57:51.215Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (1, 'FREE', 'Local Students', 'active', 3, '2025-12-31T07:27:08.313Z', '2025-12-31T08:00:30.326Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (3, 'FREE', 'Locals', 'active', 5, '2025-12-31T08:22:42.015Z', '2025-12-31T08:22:53.709Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (4, 'FREE', 'No transport route - students manage their own transportation', 'active', 9, '2025-12-31T11:08:16.071Z', '2025-12-31T11:08:16.071Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (5, 'Route A', 'Default transport route A', 'active', 9, '2025-12-31T11:08:16.095Z', '2025-12-31T11:08:16.095Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (6, 'Route B', 'Default transport route B', 'active', 9, '2025-12-31T11:08:16.117Z', '2025-12-31T11:08:16.117Z');
INSERT INTO "routes" ("id", "name", "description", "status", "schoolId", "createdAt", "updatedAt") VALUES (7, 'Route C', 'Default transport route C', 'active', 9, '2025-12-31T11:08:16.143Z', '2025-12-31T11:08:16.143Z');


-- Table: schools
DROP TABLE IF EXISTS "schools" CASCADE;
CREATE TABLE "schools" (
  "id" integer NOT NULL DEFAULT nextval('schools_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "subdomain" character varying(255) NOT NULL,
  "email" character varying(255),
  "phone" character varying(255),
  "address" text,
  "logo" character varying(255),
  "settings" jsonb,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::schools_status_enum,
  "createdById" integer,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: schools
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (3, 'School 001', 'sch001', 'sch001@school.com', '7006124578', 'Safapora', NULL, NULL, 'active', 1, '2025-12-31T02:13:48.338Z', '2025-12-31T02:13:48.338Z');
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (5, 'School 002', 'sch002', 'sch001@school.com', '7006124578', 'Safapora', NULL, NULL, 'active', 1, '2025-12-31T02:13:48.338Z', '2025-12-31T02:13:48.338Z');
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (6, 'School 003', 'sch003', 'sch001@school.com', '7006124578', 'Safapora', NULL, NULL, 'active', 1, '2025-12-31T02:13:48.338Z', '2025-12-31T11:05:14.229Z');
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (9, 'New School', 'newsch', 'newsch@school.com', '7006124578', 'New School address', NULL, NULL, 'active', 1, '2025-12-31T11:08:15.482Z', '2025-12-31T11:08:15.482Z');
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (8, 'School 005', 'sch005', 'sch001@school.com', '7006124578', 'Safapora', NULL, NULL, 'inactive', 1, '2025-12-31T02:13:48.338Z', '2026-01-02T03:39:05.999Z');
INSERT INTO "schools" ("id", "name", "subdomain", "email", "phone", "address", "logo", "settings", "status", "createdById", "createdAt", "updatedAt") VALUES (7, 'School 004', 'sch004', 'sch001@school.com', '7006124578', 'Safapora', NULL, NULL, 'inactive', 1, '2025-12-31T02:13:48.338Z', '2026-01-02T03:39:42.569Z');


-- Table: settings
DROP TABLE IF EXISTS "settings" CASCADE;
CREATE TABLE "settings" (
  "id" integer NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
  "key" character varying(100) NOT NULL,
  "value" text,
  "type" character varying(50) NOT NULL DEFAULT 'string'::character varying,
  "category" character varying(100),
  "description" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: settings
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (1, 'appName', 'School ERP Platform', 'string', 'general', 'Application name', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (3, 'timezone', 'Asia/Kolkata', 'string', 'general', 'Default timezone', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (4, 'dateFormat', 'DD/MM/YYYY', 'string', 'general', 'Date format', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (5, 'currency', 'INR', 'string', 'general', 'Default currency', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (6, 'language', 'en', 'string', 'general', 'Default language', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (8, 'emailProvider', 'smtp', 'string', 'email', 'Email provider', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (9, 'smtpHost', '', 'string', 'email', 'SMTP host', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (10, 'smtpPort', '587', 'number', 'email', 'SMTP port', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (13, 'smtpFromEmail', '', 'string', 'email', 'From email address', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (14, 'smtpFromName', 'School ERP Platform', 'string', 'email', 'From name', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (15, 'emailEncryption', 'tls', 'string', 'email', 'Email encryption type', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (17, 'smsProvider', 'twilio', 'string', 'sms', 'SMS provider', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (19, 'smsApiSecret', '', 'string', 'sms', 'SMS API secret', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (21, 'sessionTimeout', '30', 'number', 'security', 'Session timeout in minutes', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (22, 'passwordMinLength', '8', 'number', 'security', 'Minimum password length', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (23, 'requireStrongPassword', 'true', 'boolean', 'security', 'Require strong password', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (24, 'enableTwoFactor', 'false', 'boolean', 'security', 'Enable two-factor authentication', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (25, 'maxLoginAttempts', '5', 'number', 'security', 'Maximum login attempts', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (26, 'enableEmailNotifications', 'true', 'boolean', 'notifications', 'Enable email notifications', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (27, 'enableSmsNotifications', 'false', 'boolean', 'notifications', 'Enable SMS notifications', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (28, 'enablePushNotifications', 'true', 'boolean', 'notifications', 'Enable push notifications', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (31, 'backupRetentionDays', '30', 'number', 'backup', 'Backup retention period in days', '2026-01-03T04:30:44.084Z', '2026-01-03T04:30:44.084Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (2, 'appUrl', 'http://localhost:5173/', 'string', 'general', 'Application URL', '2026-01-03T04:30:44.084Z', '2026-01-03T04:36:59.654Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (7, 'emailEnabled', 'true', 'boolean', 'email', 'Enable email notifications', '2026-01-03T04:30:44.084Z', '2026-01-03T04:37:50.926Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (11, 'smtpUsername', 'su@admin.com', 'string', 'email', 'SMTP username', '2026-01-03T04:30:44.084Z', '2026-01-03T04:37:50.964Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (12, 'smtpPassword', 'admin123', 'string', 'email', 'SMTP password', '2026-01-03T04:30:44.084Z', '2026-01-03T04:37:50.975Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (16, 'smsEnabled', 'true', 'boolean', 'sms', 'Enable SMS notifications', '2026-01-03T04:30:44.084Z', '2026-01-03T04:38:06.936Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (18, 'smsApiKey', 'admin123', 'string', 'sms', 'SMS API key', '2026-01-03T04:30:44.084Z', '2026-01-03T04:38:06.956Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (20, 'smsSenderId', 'su@admin.com', 'string', 'sms', 'SMS sender ID', '2026-01-03T04:30:44.084Z', '2026-01-03T04:38:06.977Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (29, 'autoBackupEnabled', 'true', 'boolean', 'backup', 'Enable automatic backups', '2026-01-03T04:30:44.084Z', '2026-01-03T04:38:41.651Z');
INSERT INTO "settings" ("id", "key", "value", "type", "category", "description", "createdAt", "updatedAt") VALUES (30, 'backupFrequency', 'weekly', 'string', 'backup', 'Backup frequency', '2026-01-03T04:30:44.084Z', '2026-01-03T04:38:41.669Z');


-- Table: student_academic_records
DROP TABLE IF EXISTS "student_academic_records" CASCADE;
CREATE TABLE "student_academic_records" (
  "id" integer NOT NULL DEFAULT nextval('student_academic_records_id_seq'::regclass),
  "studentId" integer NOT NULL,
  "academicYearId" integer NOT NULL,
  "classId" integer NOT NULL,
  "section" character varying(50),
  "rollNumber" character varying(50),
  "admissionNumber" character varying(255),
  "remarks" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::student_academic_records_status_enum,
  "schoolId" integer NOT NULL
);

-- Data for table: student_academic_records
INSERT INTO "student_academic_records" ("id", "studentId", "academicYearId", "classId", "section", "rollNumber", "admissionNumber", "remarks", "createdAt", "updatedAt", "status", "schoolId") VALUES (1, 1, 4, 1, NULL, NULL, NULL, NULL, '2026-01-01T03:31:22.241Z', '2026-01-01T03:31:22.241Z', 'active', 9);
INSERT INTO "student_academic_records" ("id", "studentId", "academicYearId", "classId", "section", "rollNumber", "admissionNumber", "remarks", "createdAt", "updatedAt", "status", "schoolId") VALUES (2, 2, 4, 9, NULL, NULL, NULL, NULL, '2026-01-01T03:44:29.182Z', '2026-01-01T03:44:29.182Z', 'active', 9);
INSERT INTO "student_academic_records" ("id", "studentId", "academicYearId", "classId", "section", "rollNumber", "admissionNumber", "remarks", "createdAt", "updatedAt", "status", "schoolId") VALUES (3, 3, 4, 8, NULL, NULL, NULL, NULL, '2026-01-01T10:12:06.401Z', '2026-01-01T10:12:06.401Z', 'active', 9);


-- Table: student_fee_structures
DROP TABLE IF EXISTS "student_fee_structures" CASCADE;
CREATE TABLE "student_fee_structures" (
  "id" integer NOT NULL DEFAULT nextval('student_fee_structures_id_seq'::regclass),
  "studentId" integer NOT NULL,
  "feeStructureId" integer NOT NULL,
  "amount" numeric NOT NULL,
  "dueDate" date NOT NULL,
  "status" USER-DEFINED NOT NULL DEFAULT 'pending'::student_fee_structures_status_enum,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  "academicYearId" integer NOT NULL,
  "academicRecordId" integer
);


-- Table: students
DROP TABLE IF EXISTS "students" CASCADE;
CREATE TABLE "students" (
  "id" integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  "userId" integer,
  "studentId" character varying(255) NOT NULL,
  "firstName" character varying(255) NOT NULL,
  "lastName" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "phone" character varying(255),
  "address" text,
  "status" USER-DEFINED NOT NULL DEFAULT 'active'::students_status_enum,
  "schoolId" integer NOT NULL,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  "dateOfBirth" date,
  "gender" character varying(20),
  "bloodGroup" character varying(10),
  "admissionDate" date NOT NULL,
  "admissionNumber" character varying(255),
  "photoUrl" character varying(500),
  "parentName" character varying(255),
  "parentEmail" character varying(255),
  "parentPhone" character varying(255),
  "parentRelation" character varying(255)
);

-- Data for table: students
INSERT INTO "students" ("id", "userId", "studentId", "firstName", "lastName", "email", "phone", "address", "status", "schoolId", "createdAt", "updatedAt", "dateOfBirth", "gender", "bloodGroup", "admissionDate", "admissionNumber", "photoUrl", "parentName", "parentEmail", "parentPhone", "parentRelation") VALUES (1, NULL, '1', 'dsg', 'dsg', 'fdgs@dfgs.fhg', NULL, NULL, 'active', 9, '2026-01-01T03:31:22.180Z', '2026-01-01T03:41:16.776Z', NULL, NULL, NULL, '2025-12-31T18:30:00.000Z', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "students" ("id", "userId", "studentId", "firstName", "lastName", "email", "phone", "address", "status", "schoolId", "createdAt", "updatedAt", "dateOfBirth", "gender", "bloodGroup", "admissionDate", "admissionNumber", "photoUrl", "parentName", "parentEmail", "parentPhone", "parentRelation") VALUES (3, NULL, '3', 'sdsd', 'sdsd', 'dsds@dfdf.fddf', NULL, NULL, 'active', 9, '2026-01-01T10:12:06.318Z', '2026-01-01T13:45:07.370Z', NULL, NULL, NULL, '2025-12-31T18:30:00.000Z', NULL, NULL, 'gdfgfd', NULL, 'ret4645645', 'father');
INSERT INTO "students" ("id", "userId", "studentId", "firstName", "lastName", "email", "phone", "address", "status", "schoolId", "createdAt", "updatedAt", "dateOfBirth", "gender", "bloodGroup", "admissionDate", "admissionNumber", "photoUrl", "parentName", "parentEmail", "parentPhone", "parentRelation") VALUES (2, NULL, '2', 'Aamir', 'Aamir', 'sadas@sfdf.com', NULL, NULL, 'active', 9, '2026-01-01T03:44:29.127Z', '2026-01-01T15:08:17.159Z', NULL, NULL, NULL, '2025-12-31T18:30:00.000Z', NULL, NULL, 'Bashir', NULL, '700111111', 'father');


-- Table: user_roles
DROP TABLE IF EXISTS "user_roles" CASCADE;
CREATE TABLE "user_roles" (
  "id" integer NOT NULL DEFAULT nextval('user_roles_id_seq'::regclass),
  "name" character varying(50) NOT NULL,
  "displayName" character varying(100),
  "description" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- Data for table: user_roles
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (6, 'super_admin', 'Super Admin', 'Super administrator with full system access', true, '2026-01-03T02:09:10.440Z', '2026-01-03T02:09:10.440Z');
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (7, 'administrator', 'Administrator', 'School administrator', true, '2026-01-03T02:09:10.440Z', '2026-01-03T02:09:10.440Z');
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (8, 'accountant', 'Accountant', 'School accountant', true, '2026-01-03T02:09:10.440Z', '2026-01-03T02:09:10.440Z');
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (9, 'student', 'Student', 'Student user', true, '2026-01-03T02:09:10.440Z', '2026-01-03T02:09:10.440Z');
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (10, 'parent', 'Parent', 'Parent user', true, '2026-01-03T02:09:10.440Z', '2026-01-03T02:09:10.440Z');
INSERT INTO "user_roles" ("id", "name", "displayName", "description", "isActive", "createdAt", "updatedAt") VALUES (11, 'driver', 'Driver', 'School Driver', true, '2026-01-03T07:51:24.529Z', '2026-01-03T07:51:24.529Z');


-- Table: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
  "id" integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "name" character varying(255) NOT NULL,
  "email" character varying(255) NOT NULL,
  "emailVerifiedAt" timestamp without time zone,
  "password" character varying NOT NULL,
  "rememberToken" character varying,
  "schoolId" integer,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  "roleId" integer
);

-- Data for table: users
INSERT INTO "users" ("id", "name", "email", "emailVerifiedAt", "password", "rememberToken", "schoolId", "createdAt", "updatedAt", "roleId") VALUES (4, 'Super Admin', 'su@admin.com', NULL, '$2b$10$Iv0ko4xPqQDamBjkg6g.2uzoxrY34vB77YZr1fvagMhPVdI3A9kIi', NULL, NULL, '2025-12-31T17:15:42.895Z', '2026-01-03T02:16:45.097Z', 6);
INSERT INTO "users" ("id", "name", "email", "emailVerifiedAt", "password", "rememberToken", "schoolId", "createdAt", "updatedAt", "roleId") VALUES (5, 'Admin', 'admin@sch003.com', NULL, 'admin123', NULL, 6, '2026-01-02T06:16:06.241Z', '2026-01-03T02:16:45.083Z', 7);
INSERT INTO "users" ("id", "name", "email", "emailVerifiedAt", "password", "rememberToken", "schoolId", "createdAt", "updatedAt", "roleId") VALUES (1, 'Admin', 'admin@sch001.com', NULL, '123456789', NULL, 3, '2025-12-31T02:13:18.942Z', '2026-01-03T02:16:45.105Z', 7);
INSERT INTO "users" ("id", "name", "email", "emailVerifiedAt", "password", "rememberToken", "schoolId", "createdAt", "updatedAt", "roleId") VALUES (3, 'New School Administrator', 'admin@newsch.school', NULL, '$2b$10$kJwO2MY5WSwpmrn15JUJVuK/eNXedOtnYBhBlsm1zMpYyinmpoLLC', NULL, 9, '2025-12-31T11:08:15.610Z', '2026-01-03T02:16:45.111Z', 7);
INSERT INTO "users" ("id", "name", "email", "emailVerifiedAt", "password", "rememberToken", "schoolId", "createdAt", "updatedAt", "roleId") VALUES (2, 'School 001 Administrator', 'admin@sch001.school', NULL, '$2b$10$OK0gI5G5Ycinuo36tRpCCONMbQqMuOdrW5124IPMZiHINrD.YiiqK', NULL, 3, '2025-12-31T02:13:48.447Z', '2026-01-03T02:16:45.117Z', 7);

