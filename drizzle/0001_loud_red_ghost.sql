CREATE TABLE "session_participants" (
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"username" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_participants_visitor_id_session_id_pk" PRIMARY KEY("visitor_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;