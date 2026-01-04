'use client';

import { useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Terminal, Sparkles } from 'lucide-react';
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
import { BottomPanel } from './bottom-panel';
import { AssistantPanel } from './assistant-panel';
import { MainContent } from './main-content';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    assistantPanelOpen,
    assistantDrawerExpanded,
    assistantDrawerHeight,
    toggleSidebar,
    toggleAssistantPanel,
    toggleAssistantDrawer,
    setAssistantDrawerHeight,
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
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (currentProjectId) {
      fetchDatasets(currentProjectId);
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
      fetchDatasetProfile(currentDatasetId, currentDatasetVersionId);
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

  const drawerHeight = assistantDrawerExpanded ? assistantDrawerHeight : 64;
  const sidebarPixelWidth = sidebarOpen ? sidebarWidth : sidebarCollapsedWidth;

  const startDrawerDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = assistantDrawerHeight;
    const maxHeight = Math.min(window.innerHeight * 0.5, 520);

    const onMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const nextHeight = Math.min(maxHeight, Math.max(96, startHeight + delta));
      setAssistantDrawerHeight(nextHeight);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar />

        <div
          className="border-r border-white/10 bg-[#060a12] transition-all duration-300"
          style={{ width: sidebarPixelWidth }}
        >
          <Sidebar collapsed={!sidebarOpen} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="px-4 pt-3">
            <TabBar />
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-4">
            <div className="h-full rounded-2xl bg-[#0a0f1a] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(3,7,18,0.35)] overflow-hidden transition-all">
              <MainContent />
            </div>
          </div>

          {assistantPanelOpen && (
            <div
              className="absolute left-4 right-4 bottom-4 rounded-2xl border border-white/10 bg-[#060a12]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(2,6,23,0.6)] transition-all duration-300"
              style={{ height: drawerHeight, maxHeight: '50vh' }}
            >
              <div
                className="h-6 flex items-center justify-center cursor-pointer text-white/40"
                onClick={toggleAssistantDrawer}
                onMouseDown={startDrawerDrag}
              >
                <div className="h-1 w-12 rounded-full bg-white/20" />
              </div>
              <div className="h-[calc(100%-24px)]">
                <AssistantPanel collapsed={!assistantDrawerExpanded} />
              </div>
            </div>
          )}
          {!assistantPanelOpen && (
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-6 right-6 h-10 w-10 rounded-full border-white/10 bg-[#060a12] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              onClick={toggleAssistantPanel}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <StatusBar onToggleAssistant={toggleAssistantPanel} />
    </div>
  );
}

function StatusBar({ onToggleAssistant }: { onToggleAssistant: () => void }) {
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();
  const { bottomPanelOpen, toggleBottomPanel } = useLayoutStore();

  const datasets = currentProjectId ? datasetsByProject[currentProjectId] ?? [] : [];
  const activeDataset = datasets.find((dataset) => dataset.id === currentDatasetId);

  return (
    <div className="h-6 bg-[#05080f] text-white/60 flex items-center justify-between px-3 text-[11px] border-t border-white/10">
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-3.5 w-3.5 text-cyan-300" />
        <span>{activeDataset?.name ?? 'No dataset loaded'}</span>
        {activeDataset && (
          <span className="text-white/40">
            {activeDataset.rowCount.toLocaleString()} rows · {activeDataset.columns.length} cols
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 gap-1 text-[11px] text-white/60 hover:text-white"
          onClick={onToggleAssistant}
        >
          Assistant
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 gap-1 text-[11px] text-white/60 hover:text-white"
          onClick={toggleBottomPanel}
        >
          <Terminal className="h-3 w-3" />
          Jobs (2)
        </Button>
      </div>

      <Dialog open={bottomPanelOpen} onOpenChange={toggleBottomPanel}>
        <DialogContent className="max-w-2xl bg-[#0b111c] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Jobs & Logs</DialogTitle>
          </DialogHeader>
          <div className="h-[420px] rounded-xl border border-white/10 overflow-hidden">
            <BottomPanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
