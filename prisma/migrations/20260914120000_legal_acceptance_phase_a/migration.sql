-- @file 20260914120000_legal_acceptance_phase_a/migration.sql
-- @description Ley 527 electronic acceptance audit trail for signup and checkout.
-- @dependencies PostgreSQL 15+, profiles

CREATE TYPE "LegalAcceptanceSource" AS ENUM ('signup', 'checkout');

CREATE TABLE "legal_acceptances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "terms_version_id" TEXT NOT NULL,
    "privacy_version_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "LegalAcceptanceSource" NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_acceptances_user_id_idx" ON "legal_acceptances"("user_id");

CREATE INDEX "legal_acceptances_user_id_source_idx" ON "legal_acceptances"("user_id", "source");

CREATE INDEX "legal_acceptances_accepted_at_idx" ON "legal_acceptances"("accepted_at");

ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
