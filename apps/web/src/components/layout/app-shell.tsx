'use client';

import { useEffect } from 'react';
import { useLayoutStore } from '@/store/layout-store';
import { useWorkspaceStore } from '@/store/workspace-store';
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
