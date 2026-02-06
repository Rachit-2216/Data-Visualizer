'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayoutStore } from '@/store/layout-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import { useHydrated } from '@/hooks/use-hydrated';
import { TopBar } from './top-bar';
import { ActivityBar } from './activity-bar';
import { Sidebar } from './sidebar';
import { TabBar } from './tab-bar';
import { MainContent } from './main-content';
import { AssistantDrawer } from './assistant-drawer';
import { StatusBar } from './status-bar';

function AppShellSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="h-10 bg-[#060a12] border-b border-white/10" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-12 bg-[#060a12] border-r border-white/10" />
        <div className="flex-1 bg-background" />
      </div>
      <div className="h-6 bg-[#05080f] border-t border-white/10" />
    </div>
  );
}

export function AppShell() {
  const hydrated = useHydrated();
  const {
    sidebarOpen,
    sidebarWidth,
    sidebarCollapsedWidth,
    toggleSidebar,
  } = useLayoutStore();
  const { initializeWorkspace, setProject, setDataset } = useWorkspaceStore();
  const router = useRouter();
  const { initialize, user, demoBannerDismissed, dismissDemoBanner } = useAuthStore();
  const { currentProjectId, fetchProjects } = useProjectStore();
  const {
    fetchDatasets,
    datasetsByProject,
    currentDatasetId,
    currentDatasetVersionId,
    selectDataset,
    fetchDatasetProfile,
  } = useDatasetStore();

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    void fetchProjects().catch(() => {});
  }, [fetchProjects]);

  useEffect(() => {
    if (currentProjectId) {
      void fetchDatasets(currentProjectId).catch(() => {});
    }
  }, [currentProjectId, fetchDatasets]);

  useEffect(() => {
    if (!currentProjectId) return;
    const datasets = datasetsByProject[currentProjectId] ?? [];
    const isActiveValid = datasets.some((dataset) => dataset.id === currentDatasetId);
    if (!isActiveValid && datasets.length > 0) {
      selectDataset(datasets[0].id);
    }
  }, [currentDatasetId, currentProjectId, datasetsByProject, selectDataset]);

  useEffect(() => {
    if (currentProjectId) {
      setProject(currentProjectId);
    }
  }, [currentProjectId, setProject]);

  useEffect(() => {
    if (currentDatasetId) {
      setDataset(currentDatasetId, currentDatasetVersionId ?? `${currentDatasetId}-v1`);
    }
  }, [currentDatasetId, currentDatasetVersionId, setDataset]);

  useEffect(() => {
    if (currentDatasetId && currentDatasetVersionId) {
      void fetchDatasetProfile(currentDatasetId, currentDatasetVersionId).catch(() => {});
    }
  }, [currentDatasetId, currentDatasetVersionId, fetchDatasetProfile]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  if (!hydrated) {
    return <AppShellSkeleton />;
  }

  const sidebarPixelWidth = sidebarOpen ? sidebarWidth : sidebarCollapsedWidth;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" suppressHydrationWarning>
      {!user && !demoBannerDismissed && (
        <div className="w-full bg-amber-500/10 border-b border-amber-400/20 text-amber-100 text-xs px-4 py-2 flex items-center justify-between">
          <span>You're in demo mode. Sign in to save your work.</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium hover:bg-amber-400/30"
              onClick={() => router.push('/login')}
            >
              Sign in
            </button>
            <button
              className="rounded-full border border-amber-400/30 px-3 py-1 text-xs font-medium hover:bg-amber-400/10"
              onClick={dismissDemoBanner}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <TopBar />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <ActivityBar />

        <div
          className="border-r border-white/10 bg-[#060a12] transition-all duration-300"
          style={{ width: sidebarPixelWidth }}
        >
          <Sidebar collapsed={!sidebarOpen} />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="px-4 pt-3">
            <TabBar />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
            <div className="h-full rounded-2xl bg-[#0a0f1a] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(3,7,18,0.35)] overflow-hidden transition-all">
              <MainContent />
            </div>
          </div>

          <AssistantDrawer />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
