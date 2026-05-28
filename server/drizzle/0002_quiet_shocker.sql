ALTER TABLE "ancestor_profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "birth_year" integer;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "death_year" integer;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "origin_country" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "destination" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "relationship" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_location" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_location" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "heritage_regions" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "research_interests" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_complete" boolean DEFAULT false NOT NULL;