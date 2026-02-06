'use client';

import { useWorkspaceStore } from '@/store/workspace-store';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { DataTab } from '@/components/tabs/data-tab';
import { VisualsTab } from '@/components/tabs/visuals-tab';
import { SandboxTab } from '@/components/tabs/sandbox-tab';
import { CodeVizTab } from '@/components/tabs/code-viz-tab';

export function MainContent() {
  const { tabs, activeTabId } = useWorkspaceStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/60 bg-[#0a0f1a]">
        <p>No tab selected</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-transparent">
      {activeTab.type === 'overview' && <OverviewTab />}
      {activeTab.type === 'data' && <DataTab />}
      {activeTab.type === 'visuals' && <VisualsTab />}
      {activeTab.type === 'code-viz' && <CodeVizTab />}
      {activeTab.type === 'sandbox' && <SandboxTab />}
      {activeTab.type === 'drift' && (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Data Drift Analysis</h2>
          <p className="text-muted-foreground">
            Upload a second version of your dataset to compare distributions and detect drift.
          </p>
        </div>
      )}
    </div>
  );
}
