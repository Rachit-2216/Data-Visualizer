-- DataCanvas Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Datasets (logical dataset container)
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dataset versions (each file upload)
CREATE TABLE dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  row_count_est BIGINT,
  column_count_est INT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'profiling', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dataset_id, version_number)
);

-- Dataset profiles (JSON outputs from profiler)
CREATE TABLE dataset_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_json JSONB NOT NULL,
  sample_preview_json JSONB,
  warnings_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved charts
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  spec JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations (for chat)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  tool_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Background jobs queue
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('profile', 'drift', 'export')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_datasets_project_id ON datasets(project_id);
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);
CREATE INDEX idx_dataset_versions_status ON dataset_versions(status);
CREATE INDEX idx_dataset_profiles_version_id ON dataset_profiles(dataset_version_id);
CREATE INDEX idx_charts_version_id ON charts(dataset_version_id);
CREATE INDEX idx_charts_user_id ON charts(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Datasets policies
CREATE POLICY "Users can view own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);

-- Dataset versions policies
CREATE POLICY "Users can view own dataset versions"
  ON dataset_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dataset versions"
  ON dataset_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dataset versions"
  ON dataset_versions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dataset versions"
  ON dataset_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Dataset profiles policies
CREATE POLICY "Users can view own profiles"
  ON dataset_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles"
  ON dataset_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Charts policies
CREATE POLICY "Users can view own charts"
  ON charts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own charts"
  ON charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charts"
  ON charts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own charts"
  ON charts FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SERVICE ROLE POLICIES (for profiler service)
-- ============================================

-- Allow service role to update dataset_versions status
CREATE POLICY "Service role can update dataset versions"
  ON dataset_versions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON dataset_profiles FOR INSERT
  WITH CHECK (true);

-- Allow service role to update jobs
CREATE POLICY "Service role can update jobs"
  ON jobs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update function for getting next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_dataset_id UUID)
RETURNS INT AS $$
DECLARE
  next_version INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM dataset_versions
  WHERE dataset_id = p_dataset_id;

  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to create dataset version and enqueue profiling job
CREATE OR REPLACE FUNCTION create_dataset_version_and_enqueue(
  p_dataset_id UUID,
  p_user_id UUID,
  p_file_path TEXT,
  p_file_type TEXT,
  p_file_size_bytes BIGINT
)
RETURNS TABLE(version_id UUID, job_id UUID) AS $$
DECLARE
  v_version_id UUID;
  v_job_id UUID;
  v_version_number INT;
BEGIN
  -- Get next version number
  SELECT get_next_version_number(p_dataset_id) INTO v_version_number;

  -- Create dataset version
  INSERT INTO dataset_versions (
    dataset_id, user_id, version_number, file_path, file_type, file_size_bytes, status
  )
  VALUES (
    p_dataset_id, p_user_id, v_version_number, p_file_path, p_file_type, p_file_size_bytes, 'uploaded'
  )
  RETURNING id INTO v_version_id;

  -- Create profiling job
  INSERT INTO jobs (
    user_id, dataset_version_id, job_type, status
  )
  VALUES (
    p_user_id, v_version_id, 'profile', 'queued'
  )
  RETURNING id INTO v_job_id;

  RETURN QUERY SELECT v_version_id, v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET (run separately in Storage settings)
-- ============================================
-- Create a bucket named 'datasets' in Supabase Storage UI
-- Set to private (not public)
-- Storage policy for user files:
-- ((bucket_id = 'datasets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
