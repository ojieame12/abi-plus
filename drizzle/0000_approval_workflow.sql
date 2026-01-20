CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_events" (
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
--> statement-breakpoint
CREATE TABLE "approval_requests" (
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
--> statement-breakpoint
CREATE TABLE "approval_rules" (
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
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"tier" text NOT NULL,
	"icon" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name"),
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"industry" text,
	"size" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"subscription_tier" text NOT NULL,
	"subscription_start" timestamp NOT NULL,
	"subscription_end" timestamp NOT NULL,
	"total_credits" integer NOT NULL,
	"bonus_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_accounts_company_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "credit_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"allocated_credits" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_allocations_team_period_unique" UNIQUE("account_id","team_id","period_start")
);
--> statement-breakpoint
CREATE TABLE "credit_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp,
	"converted_at" timestamp,
	CONSTRAINT "credit_holds_request_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "invite_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_user_unique" UNIQUE("invite_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"email" text,
	"invited_by" uuid,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"entry_type" text NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text NOT NULL,
	"performed_by" uuid,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_idempotency_unique" UNIQUE("account_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text,
	"display_name" text,
	"avatar_url" text,
	"company" text,
	"job_title" text,
	"bio" text,
	"industry" text,
	"certifications" jsonb,
	"interests" jsonb,
	"reputation" integer DEFAULT 0 NOT NULL,
	"invite_slots" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"anonymous_default" boolean DEFAULT false NOT NULL,
	"onboarding_step" text DEFAULT 'profile',
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"question_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "question_tags_question_id_tag_id_pk" PRIMARY KEY("question_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"ai_context_summary" text,
	"score" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"answer_count" integer DEFAULT 0 NOT NULL,
	"accepted_answer_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reputation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"change" integer NOT NULL,
	"reason" text NOT NULL,
	"source_type" text,
	"source_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"previous_score" integer NOT NULL,
	"previous_level" text NOT NULL,
	"current_score" integer NOT NULL,
	"current_level" text NOT NULL,
	"direction" text NOT NULL,
	"change_reason" text,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "supplier_risk_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"level" text NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"previous_score" integer,
	"factors" jsonb DEFAULT '[]'::jsonb,
	"score_history" jsonb DEFAULT '[]'::jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_risk_scores_supplier_unique" UNIQUE("supplier_id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"duns" text,
	"category" text NOT NULL,
	"industry" text,
	"city" text,
	"country" text NOT NULL,
	"region" text NOT NULL,
	"spend" integer DEFAULT 0 NOT NULL,
	"spend_formatted" text,
	"criticality" text DEFAULT 'medium' NOT NULL,
	"revenue" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_duns_unique" UNIQUE("duns")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"question_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_membership_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_company_slug_unique" UNIQUE("company_id","slug")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_badges_unique" UNIQUE("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "user_portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_portfolio_unique" UNIQUE("user_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"email_verified_at" timestamp,
	"invited_by" uuid,
	"invite_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"token_hash" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_claims" (
	"visitor_id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_user_target_unique" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"job_title" text,
	"reason" text,
	"referral_source" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_current_approver_id_users_id_fk" FOREIGN KEY ("current_approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_account_id_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_holds" ADD CONSTRAINT "credit_holds_account_id_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_uses" ADD CONSTRAINT "invite_uses_invite_id_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."invites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_uses" ADD CONSTRAINT "invite_uses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_credit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_log" ADD CONSTRAINT "reputation_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_changes" ADD CONSTRAINT "risk_changes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_risk_scores" ADD CONSTRAINT "supplier_risk_scores_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_claims" ADD CONSTRAINT "visitor_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_invite_id_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."invites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_question_id_idx" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "answers_user_id_idx" ON "answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "approval_events_request_idx" ON "approval_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "approval_events_created_idx" ON "approval_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "approval_requests_company_status_idx" ON "approval_requests" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "approval_requests_approver_status_idx" ON "approval_requests" USING btree ("current_approver_id","status");--> statement-breakpoint
CREATE INDEX "approval_requests_requester_idx" ON "approval_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "approval_requests_expires_idx" ON "approval_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "approval_requests_team_idx" ON "approval_requests" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "approval_rules_company_active_idx" ON "approval_rules" USING btree ("company_id","is_active");--> statement-breakpoint
CREATE INDEX "credit_accounts_company_id_idx" ON "credit_accounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "credit_allocations_team_idx" ON "credit_allocations" USING btree ("team_id","period_start");--> statement-breakpoint
CREATE INDEX "credit_holds_account_active_idx" ON "credit_holds" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "credit_holds_created_active_idx" ON "credit_holds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_created_idx" ON "ledger_entries" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_type_idx" ON "ledger_entries" USING btree ("account_id","transaction_type");--> statement-breakpoint
CREATE INDEX "ledger_entries_reference_idx" ON "ledger_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "questions_user_id_idx" ON "questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reputation_log_user_id_idx" ON "reputation_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "risk_changes_supplier_id_idx" ON "risk_changes" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "risk_changes_date_idx" ON "risk_changes" USING btree ("change_date");--> statement-breakpoint
CREATE INDEX "risk_changes_direction_idx" ON "risk_changes" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "supplier_risk_scores_supplier_id_idx" ON "supplier_risk_scores" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_risk_scores_level_idx" ON "supplier_risk_scores" USING btree ("level");--> statement-breakpoint
CREATE INDEX "suppliers_category_idx" ON "suppliers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "suppliers_region_idx" ON "suppliers" USING btree ("region");--> statement-breakpoint
CREATE INDEX "suppliers_country_idx" ON "suppliers" USING btree ("country");--> statement-breakpoint
CREATE INDEX "team_memberships_user_id_idx" ON "team_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_company_id_idx" ON "teams" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "user_badges_user_id_idx" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_portfolios_user_id_idx" ON "user_portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_tokens_identifier_type_idx" ON "verification_tokens" USING btree ("identifier","type");--> statement-breakpoint
CREATE INDEX "votes_target_idx" ON "votes" USING btree ("target_type","target_id");