ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "cards are readable by anyone" ON "cards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "anyone can create a card" ON "cards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("cards"."created_by_id" = auth.jwt()->'user_metadata'->>'visitor_id');--> statement-breakpoint
CREATE POLICY "update card if allowed" ON "cards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
      "cards"."created_by_id" = auth.jwt()->'user_metadata'->>'visitor_id'
      or exists (
        select 1
        from sessions s
        where s.id = "cards"."session_id"
        and s.move_permission = 'everyone'
      )) WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'visitor_id' = "cards"."created_by_id");--> statement-breakpoint
CREATE POLICY "session creator can delete empty cards" ON "cards" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
      ("cards"."content" = '')
      and exists (
        select 1
        from sessions s
        where s.id = "cards"."session_id"
        and s.created_by_id = auth.jwt() -> 'user_metadata' ->> 'visitor_id') WITH CHECK ("cards"."content" = '');--> statement-breakpoint
CREATE POLICY "card creator can delete own cards" ON "cards" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("cards"."created_by_id" = auth.jwt() -> 'user_metadata' ->> 'visitor_id') WITH CHECK ("cards"."created_by_id" = auth.jwt() -> 'user_metadata' ->> 'visitor_id');--> statement-breakpoint
CREATE POLICY "session participants are readable by anyone" ON "session_participants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "user can join a session" ON "session_participants" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("session_participants"."user_id" = auth.jwt()->'user_metadata'->>'visitor_id');--> statement-breakpoint
CREATE POLICY "session is readable by anyone" ON "sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "only creator can update session permissions" ON "sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (auth.jwt()->'user_metadata'->>'visitor_id' = "sessions"."created_by_id") WITH CHECK (auth.jwt()->'user_metadata'->>'visitor_id' = "sessions"."created_by_id");--> statement-breakpoint
CREATE POLICY "users are readable" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "users can update their own profile" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."id" = auth.jwt() -> 'user_metadata' ->> 'visitor_id') WITH CHECK ("users"."id" = auth.jwt() -> 'user_metadata' ->> 'visitor_id');