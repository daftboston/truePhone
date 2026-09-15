-- @file 20260914230000_pqr_cases/migration.sql
-- @description Adds consumer PQR cases (retracto, peticiones, quejas, reclamos).
-- @dependencies PostgreSQL 15+, profiles, orders

-- CreateEnum
CREATE TYPE "PqrCaseType" AS ENUM (
    'PETICION',
    'QUEJA',
    'RECLAMO',
    'RETRACTO',
    'HABEAS_DATA',
    'OTRO'
);

-- CreateEnum
CREATE TYPE "PqrCaseStatus" AS ENUM (
    'PENDING',
    'IN_REVIEW',
    'RESPONDED',
    'CLOSED'
);

-- CreateTable
CREATE TABLE "pqr_cases" (
    "id" TEXT NOT NULL,
    "radicado" TEXT NOT NULL,
    "tipo" "PqrCaseType" NOT NULL,
    "status" "PqrCaseStatus" NOT NULL DEFAULT 'PENDING',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "respuesta" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "assignedStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pqr_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pqr_cases_radicado_key" ON "pqr_cases"("radicado");

CREATE INDEX "pqr_cases_status_createdAt_idx"
ON "pqr_cases"("status", "createdAt");

CREATE INDEX "pqr_cases_tipo_status_createdAt_idx"
ON "pqr_cases"("tipo", "status", "createdAt");

CREATE INDEX "pqr_cases_assignedStaffId_status_idx"
ON "pqr_cases"("assignedStaffId", "status");

-- AddForeignKey
ALTER TABLE "pqr_cases"
ADD CONSTRAINT "pqr_cases_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pqr_cases"
ADD CONSTRAINT "pqr_cases_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pqr_cases"
ADD CONSTRAINT "pqr_cases_respondedById_fkey"
FOREIGN KEY ("respondedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pqr_cases"
ADD CONSTRAINT "pqr_cases_assignedStaffId_fkey"
FOREIGN KEY ("assignedStaffId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
