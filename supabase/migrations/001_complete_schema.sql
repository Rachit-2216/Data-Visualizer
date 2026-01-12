-- =====================================================
-- DataCanvas Complete Database Schema
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES (extends Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "theme": "dark",
    "defaultChartColors": ["#0ea5e9", "#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444"],
    "sidebarCollapsed": false,
    "assistantExpanded": false
  }'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DATASETS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'json', 'parquet', 'tsv', 'xlsx')),
  original_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DATASET VERSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dataset_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  row_count INTEGER,
  column_count INTEGER,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'profiling', 'ready', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id, version_number)
);

-- =====================================================
-- DATASET PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dataset_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES public.dataset_versions(id) ON DELETE CASCADE UNIQUE,
  schema_info JSONB NOT NULL DEFAULT '[]'::jsonb,
  statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlations JSONB,
  missing_values JSONB,
  warnings JSONB DEFAULT '[]'::jsonb,
  sample_data JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RESOURCE CONNECTOR (central linking layer)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resource_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  dataset_version_id UUID REFERENCES public.dataset_versions(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resource_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_resource_id UUID NOT NULL REFERENCES public.resource_registry(id) ON DELETE CASCADE,
  to_resource_id UUID NOT NULL REFERENCES public.resource_registry(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- JOBS (Background Processing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('profile', 'train', 'inference', 'export')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ML MODELS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES public.dataset_versions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('classification', 'regression', 'clustering')),
  algorithm TEXT NOT NULL,
  target_column TEXT,
  feature_columns JSONB DEFAULT '[]'::jsonb,
  hyperparameters JSONB DEFAULT '{}'::jsonb,
  metrics JSONB,
  feature_importance JSONB,
  confusion_matrix JSONB,
  storage_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'training', 'trained', 'failed')),
  training_started_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT CONVERSATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES public.dataset_versions(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'New Conversation',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  chart_spec JSONB,
  tokens_used INTEGER,
  model_used TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SAVED VISUALIZATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_version_id UUID REFERENCES public.dataset_versions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  chart_type TEXT NOT NULL,
  vega_spec JSONB NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_demo ON public.projects(is_demo);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON public.datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON public.dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_status ON public.dataset_versions(status);
CREATE INDEX IF NOT EXISTS idx_dataset_profiles_version_id ON public.dataset_profiles(version_id);
CREATE INDEX IF NOT EXISTS idx_resource_registry_owner_id ON public.resource_registry(owner_id);
CREATE INDEX IF NOT EXISTS idx_resource_registry_project_id ON public.resource_registry(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_registry_dataset_id ON public.resource_registry(dataset_id);
CREATE INDEX IF NOT EXISTS idx_resource_registry_dataset_version_id ON public.resource_registry(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_resource_registry_type ON public.resource_registry(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_links_from_id ON public.resource_links(from_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_links_to_id ON public.resource_links(to_resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_links_relation_type ON public.resource_links(relation_type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_project_id ON public.ml_models(project_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON public.ml_models(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON public.chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_project_id ON public.saved_visualizations(project_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.datasets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.resource_registry;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.resource_registry
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.ml_models;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ml_models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.chat_conversations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.saved_visualizations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saved_visualizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INCREMENT MESSAGE COUNT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET message_count = message_count + 1, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_created ON public.chat_messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.increment_message_count();
