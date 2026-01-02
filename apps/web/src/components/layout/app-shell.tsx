'use client';

import { useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useLayoutStore } from '@/store/layout-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { TopBar } from './top-bar';
import { ActivityBar } from './activity-bar';
import { Sidebar } from './sidebar';
import { TabBar } from './tab-bar';
import { BottomPanel } from './bottom-panel';
import { AssistantPanel } from './assistant-panel';
import { MainContent } from './main-content';
import { cn } from '@/lib/utils';

export function AppShell() {
  const { sidebarOpen, bottomPanelOpen, assistantPanelOpen } = useLayoutStore();
  const { initializeWorkspace } = useWorkspaceStore();

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (leftmost icons) */}
        <ActivityBar />

        {/* Main Panel Group */}
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <Panel
                id="sidebar"
                defaultSize={15}
                minSize={10}
                maxSize={30}
                className="bg-sidebar border-r"
              >
                <Sidebar />
              </Panel>
              <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/50 transition-colors resize-handle" />
            </>
          )}

          {/* Center Content */}
          <Panel id="main" defaultSize={sidebarOpen ? (assistantPanelOpen ? 55 : 70) : 75}>
            <PanelGroup direction="vertical">
              {/* Tabs and Content */}
              <Panel id="content" defaultSize={bottomPanelOpen ? 70 : 100}>
                <div className="h-full flex flex-col">
                  <TabBar />
                  <MainContent />
                </div>
              </Panel>

              {/* Bottom Panel */}
              {bottomPanelOpen && (
                <>
                  <PanelResizeHandle className="h-1 bg-transparent hover:bg-primary/50 transition-colors resize-handle" />
                  <Panel id="bottom" defaultSize={30} minSize={15} maxSize={50}>
                    <BottomPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Assistant Panel */}
          {assistantPanelOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/50 transition-colors resize-handle" />
              <Panel
                id="assistant"
                defaultSize={20}
                minSize={15}
                maxSize={35}
                className="bg-sidebar border-l"
              >
                <AssistantPanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="h-6 bg-primary text-primary-foreground flex items-center justify-between px-3 text-xs">
      <div className="flex items-center gap-4">
        <span>DataCanvas</span>
        <span className="text-primary-foreground/70">Ready</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-primary-foreground/70">No dataset loaded</span>
      </div>
    </div>
  );
}
