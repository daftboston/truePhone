-- @file 20260912010000_messages_rls_realtime/migration.sql
-- @description Enable RLS on messages for Realtime postgres_changes; SELECT only for participants.
-- @dependencies PostgreSQL 15+, public.messages, public.profiles, supabase_realtime
-- Prisma connects as the table owner (BYPASSRLS). Do not FORCE ROW LEVEL SECURITY.

-- Live chat uses supabase_realtime. Without RLS, postgres_changes would leak other people's inserts.

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_select_participants ON public.messages;

CREATE POLICY messages_select_participants
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.auth_user_id = (SELECT auth.uid())::text
      AND (
        profiles.id = messages."senderId"
        OR profiles.id = messages."receiverId"
      )
  )
);

GRANT SELECT ON TABLE public.messages TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.messages FROM authenticated;
REVOKE ALL ON TABLE public.messages FROM anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
