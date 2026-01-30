-- 🛡️ Supabase Security & RLS Fixes
-- Run this in your Supabase SQL Editor to clear the "Critical" alerts and secure your tables.

-- 1. Enable RLS on all public tables mentioned in the alerts
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JobPosting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OutsourcingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Wishlist" ENABLE ROW LEVEL SECURITY;

-- 2. Add basic 'Public Access' policies (Adjust these as needed for your specific logic)
-- Example: Allow everyone to SELECT categories, but only admins to modify them
DROP POLICY IF EXISTS "Allow public read access on Category" ON public."Category";
CREATE POLICY "Allow public read access on Category" ON public."Category" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on Comment" ON public."Comment";
CREATE POLICY "Allow public read access on Comment" ON public."Comment" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual insert access on Comment" ON public."Comment";
CREATE POLICY "Allow individual insert access on Comment" ON public."Comment" FOR INSERT WITH CHECK (auth.uid() = user_id);

-- (Repeat for other tables based on your app's needs. 
--  Usually FOR SELECT USING (true) is a safe start for public data.)

-- 3. Fix "Function Search Path Mutable" warnings
-- This ensures functions always look at the 'public' schema correctly.
ALTER FUNCTION public.confirm_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.increment_daily_visits() SET search_path = public;
ALTER FUNCTION public.increment_search_count(text) SET search_path = public;
ALTER FUNCTION public.update_project_likes_count() SET search_path = public;
ALTER FUNCTION public.update_project_rating_count() SET search_path = public;

-- 4. Ensure on_auth_user_created has the correct path too
ALTER FUNCTION public.on_auth_user_created_confirm() SET search_path = public;
