ALTER TABLE "saved_narratives" ALTER COLUMN "ancestor_profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_narratives" ADD COLUMN "query" text NOT NULL;