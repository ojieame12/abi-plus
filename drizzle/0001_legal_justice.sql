CREATE TABLE "activated_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"activated_by" uuid NOT NULL,
	"queries_this_month" integer DEFAULT 0,
	"alerts_enabled" boolean DEFAULT true,
	CONSTRAINT "activated_categories_unique" UNIQUE("category_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "category_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"color" text,
	"category_count" integer DEFAULT 0,
	CONSTRAINT "category_domains_name_unique" UNIQUE("name"),
	CONSTRAINT "category_domains_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "expert_engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"request_id" uuid,
	"client_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"credits" integer NOT NULL,
	"rating" integer,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"photo" text,
	"former_company" text NOT NULL,
	"former_title" text NOT NULL,
	"years_experience" integer NOT NULL,
	"specialties" jsonb NOT NULL,
	"industries" jsonb NOT NULL,
	"regions" jsonb NOT NULL,
	"rating" integer DEFAULT 0,
	"total_ratings" integer DEFAULT 0,
	"total_engagements" integer DEFAULT 0,
	"availability" text DEFAULT 'offline',
	"hourly_rate" integer NOT NULL,
	"is_top_voice" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "experts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "managed_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain_id" uuid NOT NULL,
	"sub_domain" text,
	"description" text,
	"lead_analyst_name" text,
	"lead_analyst_photo" text,
	"update_frequency" text NOT NULL,
	"has_market_report" boolean DEFAULT false,
	"has_price_index" boolean DEFAULT false,
	"has_supplier_data" boolean DEFAULT false,
	"response_time_sla" text DEFAULT '24 hours',
	"client_count" integer DEFAULT 0,
	"is_popular" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managed_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "activated_categories" ADD CONSTRAINT "activated_categories_category_id_managed_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."managed_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activated_categories" ADD CONSTRAINT "activated_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activated_categories" ADD CONSTRAINT "activated_categories_activated_by_users_id_fk" FOREIGN KEY ("activated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_engagements" ADD CONSTRAINT "expert_engagements_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."experts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_engagements" ADD CONSTRAINT "expert_engagements_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_engagements" ADD CONSTRAINT "expert_engagements_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experts" ADD CONSTRAINT "experts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_categories" ADD CONSTRAINT "managed_categories_domain_id_category_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."category_domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activated_categories_company_idx" ON "activated_categories" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "expert_engagements_expert_idx" ON "expert_engagements" USING btree ("expert_id");--> statement-breakpoint
CREATE INDEX "expert_engagements_client_idx" ON "expert_engagements" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "expert_engagements_status_idx" ON "expert_engagements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experts_availability_idx" ON "experts" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "experts_is_top_voice_idx" ON "experts" USING btree ("is_top_voice");--> statement-breakpoint
CREATE INDEX "experts_user_id_idx" ON "experts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "managed_categories_domain_idx" ON "managed_categories" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "managed_categories_is_popular_idx" ON "managed_categories" USING btree ("is_popular");