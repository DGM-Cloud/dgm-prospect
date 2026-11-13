-- =============================================================================
-- DGM Prospect — schema for Supabase SQL Editor
-- Paste and run this entire script once in: Supabase → SQL Editor → New query
-- =============================================================================

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Enums
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProspectStatus" AS ENUM (
    'DISCOVERED', 'TO_REVIEW', 'QUALIFIED', 'CONTACT_PENDING', 'CONTACTED',
    'REPLIED', 'MEETING', 'PROPOSAL', 'WON', 'LOST'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProspectSource" AS ENUM ('OSM', 'MANUAL', 'IMPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityType" AS ENUM (
    'NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'ASSIGNMENT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OpportunityStage" AS ENUM (
    'IDENTIFIED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "osm_places" (
  "id" TEXT NOT NULL,
  "osmType" TEXT NOT NULL,
  "osmId" BIGINT NOT NULL,
  "name" TEXT,
  "category" TEXT,
  "location" geography(Point, 4326),
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "tags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "osm_places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "prospects" (
  "id" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "category" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "instagram" TEXT,
  "facebook" TEXT,
  "status" "ProspectStatus" NOT NULL DEFAULT 'DISCOVERED',
  "source" "ProspectSource" NOT NULL DEFAULT 'OSM',
  "osmPlaceId" TEXT,
  "assignedToId" UUID,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" UUID NOT NULL,
  "zoneLabel" TEXT,
  "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_prospects" (
  "campaignId" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaign_prospects_pkey" PRIMARY KEY ("campaignId", "prospectId")
);

CREATE TABLE IF NOT EXISTS "analyses" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "finding" TEXT NOT NULL,
  "opportunity" TEXT,
  "confidence" DOUBLE PRECISION,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "activityType" "ActivityType" NOT NULL DEFAULT 'NOTE',
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "stage" "OpportunityStage" NOT NULL DEFAULT 'IDENTIFIED',
  "estimatedValue" DECIMAL(12, 2),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- 4) Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

CREATE INDEX IF NOT EXISTS "osm_places_category_idx" ON "osm_places"("category");
CREATE INDEX IF NOT EXISTS "osm_places_latitude_longitude_idx" ON "osm_places"("latitude", "longitude");
CREATE UNIQUE INDEX IF NOT EXISTS "osm_places_osmType_osmId_key" ON "osm_places"("osmType", "osmId");
CREATE INDEX IF NOT EXISTS "osm_places_location_gix" ON "osm_places" USING GIST ("location");

CREATE UNIQUE INDEX IF NOT EXISTS "prospects_osmPlaceId_key" ON "prospects"("osmPlaceId");
CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects"("status");
CREATE INDEX IF NOT EXISTS "prospects_category_idx" ON "prospects"("category");
CREATE INDEX IF NOT EXISTS "prospects_assignedToId_idx" ON "prospects"("assignedToId");
CREATE INDEX IF NOT EXISTS "prospects_businessName_idx" ON "prospects"("businessName");

CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX IF NOT EXISTS "campaigns_createdById_idx" ON "campaigns"("createdById");

CREATE INDEX IF NOT EXISTS "campaign_prospects_prospectId_idx" ON "campaign_prospects"("prospectId");
CREATE INDEX IF NOT EXISTS "analyses_prospectId_idx" ON "analyses"("prospectId");
CREATE INDEX IF NOT EXISTS "activities_prospectId_idx" ON "activities"("prospectId");
CREATE INDEX IF NOT EXISTS "activities_userId_idx" ON "activities"("userId");
CREATE INDEX IF NOT EXISTS "activities_createdAt_idx" ON "activities"("createdAt");
CREATE INDEX IF NOT EXISTS "opportunities_prospectId_idx" ON "opportunities"("prospectId");
CREATE INDEX IF NOT EXISTS "opportunities_stage_idx" ON "opportunities"("stage");

-- 5) Foreign keys (safe if re-run)
DO $$ BEGIN
  ALTER TABLE "prospects"
    ADD CONSTRAINT "prospects_osmPlaceId_fkey"
    FOREIGN KEY ("osmPlaceId") REFERENCES "osm_places"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "prospects"
    ADD CONSTRAINT "prospects_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_prospects"
    ADD CONSTRAINT "campaign_prospects_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_prospects"
    ADD CONSTRAINT "campaign_prospects_prospectId_fkey"
    FOREIGN KEY ("prospectId") REFERENCES "prospects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "analyses"
    ADD CONSTRAINT "analyses_prospectId_fkey"
    FOREIGN KEY ("prospectId") REFERENCES "prospects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "activities"
    ADD CONSTRAINT "activities_prospectId_fkey"
    FOREIGN KEY ("prospectId") REFERENCES "prospects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "activities"
    ADD CONSTRAINT "activities_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "opportunities"
    ADD CONSTRAINT "opportunities_prospectId_fkey"
    FOREIGN KEY ("prospectId") REFERENCES "prospects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6) Keep public.users in sync with Supabase Auth (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users ("id", "fullName", "email", "role", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Usuario DGM'),
    NEW.email,
    'MEMBER',
    NOW(),
    NOW()
  )
  ON CONFLICT ("id") DO UPDATE
    SET "email" = EXCLUDED."email",
        "updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 7) Sanity check (must return postgis_version + dgm_tables = 8)
SELECT
  PostGIS_Version() AS postgis_version,
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN (
         'users','osm_places','prospects','campaigns','campaign_prospects',
         'analyses','activities','opportunities'
       )) AS dgm_tables;

-- After this script succeeds, from your machine (with DATABASE_URL pointing to Supabase):
--   pnpm prisma migrate resolve --applied 20260312160000_init
--   pnpm prisma generate
-- That marks the Prisma init migration as already applied so deploy won't recreate tables.
