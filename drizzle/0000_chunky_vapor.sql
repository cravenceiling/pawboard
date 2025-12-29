CREATE TABLE IF NOT EXISTS "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '#fef08a' NOT NULL,
	"x" real DEFAULT 100 NOT NULL,
	"y" real DEFAULT 100 NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"voted_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_id" text NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cards" ADD CONSTRAINT "cards_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;