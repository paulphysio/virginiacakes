-- Admin users table
-- Create a small mapping table of admin user IDs from Supabase Auth
-- You can insert your user UUID(s) here or via your DB console.

create table if not exists public.admin_users (
  user_id uuid primary key,
  created_at timestamptz default now()
);

-- Optional index
create index if not exists idx_admin_users_created_at on public.admin_users(created_at);

-- Example: insert an admin (replace with your auth user id)
-- insert into public.admin_users(user_id) values ('00000000-0000-0000-0000-000000000000');
