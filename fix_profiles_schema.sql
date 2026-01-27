-- 1. Create/Update Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  full_name text,
  avatar_url text,
  profile_image_url text,
  website text,
  gender text,
  age_group text,
  occupation text,
  expertise jsonb default '[]'::jsonb,
  interests jsonb default '[]'::jsonb,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 2)
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Drop existing policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- 4. Re-create Policies (Corrected)

-- Allow public read access
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Allow users to insert their *own* profile row
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Allow users to update their *own* profile row
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 5. Grant usage (just in case)
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
