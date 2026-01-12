-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_visualizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own projects and demo projects" ON public.projects;
CREATE POLICY "Users can view own projects and demo projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id OR is_demo = TRUE);

DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own non-demo projects" ON public.projects;
CREATE POLICY "Users can delete own non-demo projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id AND is_demo = FALSE);

-- =====================================================
-- DATASETS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view datasets in accessible projects" ON public.datasets;
CREATE POLICY "Users can view datasets in accessible projects" ON public.datasets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = datasets.project_id
      AND (projects.user_id = auth.uid() OR projects.is_demo = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can create datasets in own projects" ON public.datasets;
CREATE POLICY "Users can create datasets in own projects" ON public.datasets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update datasets in own projects" ON public.datasets;
CREATE POLICY "Users can update datasets in own projects" ON public.datasets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete datasets in own projects" ON public.datasets;
CREATE POLICY "Users can delete datasets in own projects" ON public.datasets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid() AND projects.is_demo = FALSE
    )
  );

-- =====================================================
-- DATASET VERSIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view versions of accessible datasets" ON public.dataset_versions;
CREATE POLICY "Users can view versions of accessible datasets" ON public.dataset_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.datasets
      JOIN public.projects ON projects.id = datasets.project_id
      WHERE datasets.id = dataset_versions.dataset_id
      AND (projects.user_id = auth.uid() OR projects.is_demo = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can create versions in own datasets" ON public.dataset_versions;
CREATE POLICY "Users can create versions in own datasets" ON public.dataset_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.datasets
      JOIN public.projects ON projects.id = datasets.project_id
      WHERE datasets.id = dataset_id AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- DATASET PROFILES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view profiles of accessible versions" ON public.dataset_profiles;
CREATE POLICY "Users can view profiles of accessible versions" ON public.dataset_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dataset_versions
      JOIN public.datasets ON datasets.id = dataset_versions.dataset_id
      JOIN public.projects ON projects.id = datasets.project_id
      WHERE dataset_versions.id = dataset_profiles.version_id
      AND (projects.user_id = auth.uid() OR projects.is_demo = TRUE)
    )
  );

-- =====================================================
-- RESOURCE REGISTRY POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own resources and demo resources" ON public.resource_registry;
CREATE POLICY "Users can view own resources and demo resources" ON public.resource_registry
  FOR SELECT USING (
    owner_id = auth.uid()
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_id AND projects.is_demo = TRUE
      )
    )
    OR (
      dataset_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.datasets
        JOIN public.projects ON projects.id = datasets.project_id
        WHERE datasets.id = dataset_id AND projects.is_demo = TRUE
      )
    )
    OR (
      dataset_version_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.dataset_versions
        JOIN public.datasets ON datasets.id = dataset_versions.dataset_id
        JOIN public.projects ON projects.id = datasets.project_id
        WHERE dataset_versions.id = dataset_version_id AND projects.is_demo = TRUE
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own resources" ON public.resource_registry;
CREATE POLICY "Users can create own resources" ON public.resource_registry
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own resources" ON public.resource_registry;
CREATE POLICY "Users can update own resources" ON public.resource_registry
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own resources" ON public.resource_registry;
CREATE POLICY "Users can delete own resources" ON public.resource_registry
  FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- RESOURCE LINKS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view links for owned resources" ON public.resource_links;
CREATE POLICY "Users can view links for owned resources" ON public.resource_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.resource_registry
      WHERE resource_registry.id = resource_links.from_resource_id
      AND resource_registry.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.resource_registry
      WHERE resource_registry.id = resource_links.to_resource_id
      AND resource_registry.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create links for owned resources" ON public.resource_links;
CREATE POLICY "Users can create links for owned resources" ON public.resource_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resource_registry
      WHERE resource_registry.id = from_resource_id
      AND resource_registry.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete links for owned resources" ON public.resource_links;
CREATE POLICY "Users can delete links for owned resources" ON public.resource_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.resource_registry
      WHERE resource_registry.id = from_resource_id
      AND resource_registry.owner_id = auth.uid()
    )
  );

-- =====================================================
-- JOBS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own jobs" ON public.jobs;
CREATE POLICY "Users can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own jobs" ON public.jobs;
CREATE POLICY "Users can cancel own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ML MODELS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view models in accessible projects" ON public.ml_models;
CREATE POLICY "Users can view models in accessible projects" ON public.ml_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = ml_models.project_id
      AND (projects.user_id = auth.uid() OR projects.is_demo = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can create models in own projects" ON public.ml_models;
CREATE POLICY "Users can create models in own projects" ON public.ml_models
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update models in own projects" ON public.ml_models;
CREATE POLICY "Users can update models in own projects" ON public.ml_models
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete models in own projects" ON public.ml_models;
CREATE POLICY "Users can delete models in own projects" ON public.ml_models
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- CHAT CONVERSATIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversations" ON public.chat_conversations;
CREATE POLICY "Users can create own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CHAT MESSAGES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in own conversations" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.chat_messages;
CREATE POLICY "Users can create messages in own conversations" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- =====================================================
-- SAVED VISUALIZATIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view visualizations in accessible projects" ON public.saved_visualizations;
CREATE POLICY "Users can view visualizations in accessible projects" ON public.saved_visualizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = saved_visualizations.project_id
      AND (projects.user_id = auth.uid() OR projects.is_demo = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can create visualizations in own projects" ON public.saved_visualizations;
CREATE POLICY "Users can create visualizations in own projects" ON public.saved_visualizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update visualizations in own projects" ON public.saved_visualizations;
CREATE POLICY "Users can update visualizations in own projects" ON public.saved_visualizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete visualizations in own projects" ON public.saved_visualizations;
CREATE POLICY "Users can delete visualizations in own projects" ON public.saved_visualizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- SERVICE ROLE BYPASS (for backend services)
-- =====================================================
-- Note: The service role key automatically bypasses RLS
-- This is used by the backend services for operations like:
-- - Creating profiles for datasets
-- - Updating job status
-- - Writing ML model results
