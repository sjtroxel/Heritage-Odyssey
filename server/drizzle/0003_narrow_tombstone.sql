ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "gedcom_id" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "birth_date" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "birth_place" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "death_date" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "death_place" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "arrival_date" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "arrival_port" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "departure_port" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "ship_name" text;--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "occupations" text[];--> statement-breakpoint
ALTER TABLE "ancestor_profiles" ADD COLUMN "source_summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" text DEFAULT 'password' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");