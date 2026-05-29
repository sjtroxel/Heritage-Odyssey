CREATE TABLE "eval_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" text,
	"query" text NOT NULL,
	"narrative_text" text NOT NULL,
	"faithfulness" double precision,
	"answer_relevancy" double precision,
	"context_recall" double precision,
	"historical_grounding" double precision,
	"emotional_resonance" double precision,
	"citation_coverage" double precision,
	"overall" double precision,
	"model_used" text,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);
