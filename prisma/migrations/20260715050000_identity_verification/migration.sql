-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- Repair ListingStatus variants missing from the live DB (drift from earlier push)
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'RESERVED';

-- CreateTable
CREATE TABLE "identity_verifications" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "documentType" TEXT NOT NULL DEFAULT 'cedula',
    "documentNumberLast4" TEXT,
    "documentNumberHash" TEXT,
    "frontImageUrl" TEXT,
    "backImageUrl" TEXT,
    "selfieImageUrl" TEXT,
    "privacyAcceptedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "rejectionReason" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_verifications_profileId_idx" ON "identity_verifications"("profileId");

-- CreateIndex
CREATE INDEX "identity_verifications_status_idx" ON "identity_verifications"("status");

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
