-- ==============================================================================
-- BRAYAN AUTO SALES - FULL SUPABASE DATABASE & STORAGE SCHEMA
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hrnhoewivfnhqukctimg/sql/new
-- ==============================================================================

-- 1. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    bids_count INTEGER DEFAULT 0,
    days_left TEXT,
    image TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    transmission TEXT DEFAULT 'Automatic',
    body_style TEXT DEFAULT 'Sedan',
    specs TEXT,
    location TEXT,
    is_featured BOOLEAN DEFAULT false,
    no_reserve BOOLEAN DEFAULT false,
    bucket_slug TEXT DEFAULT 'vehicle-images',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREDIT APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.credit_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending',
    vehicle_id TEXT,
    vehicle_name TEXT,
    applicant_name TEXT NOT NULL,
    address TEXT,
    dob TEXT,
    ssn TEXT,
    email TEXT,
    phone TEXT,
    employer_name TEXT,
    job_title TEXT,
    monthly_salary TEXT,
    employment_status TEXT,
    other_income_source TEXT,
    loan_amount TEXT,
    loan_purpose TEXT,
    repayment_term TEXT,
    interest_rate TEXT,
    make TEXT,
    model TEXT,
    year TEXT,
    purchase_price TEXT,
    trade_in_value TEXT
);

-- 3. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    status TEXT DEFAULT 'open', -- 'open' or 'closed'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user' or 'admin'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE ROW LEVEL SECURITY & OPEN ACCESS POLICIES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Vehicles policies
CREATE POLICY "Allow public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public write vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Credit applications policies
CREATE POLICY "Allow public read credit_applications" ON public.credit_applications FOR SELECT USING (true);
CREATE POLICY "Allow public write credit_applications" ON public.credit_applications FOR ALL USING (true) WITH CHECK (true);

-- Conversations policies
CREATE POLICY "Allow public read/write conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

-- Messages policies
CREATE POLICY "Allow public read/write messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 6. REALTIME REPLICATION (For live chat and real-time admin updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- 7. STORAGE BUCKET FOR VEHICLE MEDIA ('vehicle-images')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vehicle-images',
    'vehicle-images',
    true,
    52428800, -- 50MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for 'vehicle-images'
CREATE POLICY "Public Access for Vehicle Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Public Upload Access for Vehicle Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Public Update Access for Vehicle Images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Public Delete Access for Vehicle Images"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-images');
