-- @file promote-reviewer.sql
-- @description Manual ops script template to promote a profile role to REVIEWER or ADMIN (commented examples).
-- @dependencies PostgreSQL 15+, Supabase

-- Promote a user to REVIEWER so they can use /revision/identidad (and Phase 6).
-- Replace the email, then run in Supabase SQL editor (or via psql).

-- Example:
-- update profiles
-- set role = 'REVIEWER'
-- where auth_user_id = (
--   select id::text from auth.users where email = 'tu-revisor@truephone.co'
-- );

-- Or by username:
-- update profiles set role = 'REVIEWER' where username = 'revisor';

-- Or by profile id:
-- update profiles set role = 'ADMIN' where id = 'clxxxxxxxx';
