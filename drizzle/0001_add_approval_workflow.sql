-- Migration: Add Approval Workflow Tables
-- Created: 2026-01-15
-- Description: Adds approval_requests, approval_events, and approval_rules tables
--              for the credit request approval workflow

-- Approval Requests - Core state machine for upgrade requests
CREATE TABLE IF NOT EXISTS "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"request_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"context" jsonb,
	"estimated_credits" integer NOT NULL,
	"actual_credits" integer,
	"current_approver_id" uuid,
	"approval_level" text,
	"escalation_count" integer DEFAULT 0 NOT NULL,
	"decision_reason" text,
	"decided_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"decided_at" timestamp,
	"fulfilled_at" timestamp,
	"expires_at" timestamp
);

-- Approval Events - Audit trail for state transitions
CREATE TABLE IF NOT EXISTS "approval_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"performed_by" uuid,
	"performed_by_system" boolean DEFAULT false NOT NULL,
	"from_status" text,
	"to_status" text,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Approval Rules - Configurable thresholds per company
CREATE TABLE IF NOT EXISTS "approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"min_credits" integer NOT NULL,
	"max_credits" integer,
	"approver_role" text NOT NULL,
	"escalation_hours" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign Keys for approval_requests
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_company_id_companies_id_fk"
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_team_id_teams_id_fk"
	FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk"
	FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_current_approver_id_users_id_fk"
	FOREIGN KEY ("current_approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decided_by_users_id_fk"
	FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Foreign Keys for approval_events
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_request_id_approval_requests_id_fk"
	FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_performed_by_users_id_fk"
	FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Foreign Keys for approval_rules
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_company_id_companies_id_fk"
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes for approval_requests
CREATE INDEX IF NOT EXISTS "approval_requests_company_status_idx" ON "approval_requests" USING btree ("company_id","status");
CREATE INDEX IF NOT EXISTS "approval_requests_approver_status_idx" ON "approval_requests" USING btree ("current_approver_id","status");
CREATE INDEX IF NOT EXISTS "approval_requests_requester_idx" ON "approval_requests" USING btree ("requester_id");
CREATE INDEX IF NOT EXISTS "approval_requests_expires_idx" ON "approval_requests" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "approval_requests_team_idx" ON "approval_requests" USING btree ("team_id");

-- Indexes for approval_events
CREATE INDEX IF NOT EXISTS "approval_events_request_idx" ON "approval_events" USING btree ("request_id");
CREATE INDEX IF NOT EXISTS "approval_events_created_idx" ON "approval_events" USING btree ("created_at");

-- Indexes for approval_rules
CREATE INDEX IF NOT EXISTS "approval_rules_company_active_idx" ON "approval_rules" USING btree ("company_id","is_active");
