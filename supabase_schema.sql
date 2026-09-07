-- ==============================================================================
-- SCHOLARPULSE AI - SUPABASE DATABASE & STORAGE SCHEMA
-- Run this in your Supabase Project SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create the 'analyses' table for storing paper metadata and analysis results
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    page_count INTEGER DEFAULT 1,
    complexity_score NUMERIC(3,1) DEFAULT 5.0,
    estimated_read_time_mins INTEGER DEFAULT 5,
    summary TEXT,
    full_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policies for 'analyses' table
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
CREATE POLICY "Users can view their own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.analyses;
CREATE POLICY "Users can insert their own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
CREATE POLICY "Users can update their own analyses"
    ON public.analyses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;
CREATE POLICY "Users can delete their own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 2. Storage Bucket: 'research-papers'
-- ==============================================================================

-- Create bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('research-papers', 'research-papers', false, 52428800, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'research-papers'
-- User can upload only into their own folder: research-papers/{user_id}/*
DROP POLICY IF EXISTS "Users can upload their own research papers" ON storage.objects;
CREATE POLICY "Users can upload their own research papers"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'research-papers' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can view/download their own research papers" ON storage.objects;
CREATE POLICY "Users can view/download their own research papers"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'research-papers' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own research papers" ON storage.objects;
CREATE POLICY "Users can delete their own research papers"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'research-papers' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
