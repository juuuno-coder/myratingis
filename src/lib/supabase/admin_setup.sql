-- Create site_config table
CREATE TABLE IF NOT EXISTS public.site_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read access" ON public.site_config
    FOR SELECT USING (true);

-- Allow admin upsert (assuming profiles.role is set)
CREATE POLICY "Allow admin all" ON public.site_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Grant access to authenticated users (fallback if role check fails initially, but protected by app logic)
-- Better: Ensure profiles.role is updated.
