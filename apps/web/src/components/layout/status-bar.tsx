'use client';

import { LayoutGrid, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLayoutStore } from '@/store/layout-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import { BottomPanel } from './bottom-panel';

export function StatusBar() {
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();
  const { bottomPanelOpen, toggleBottomPanel, toggleAssistantPanel } = useLayoutStore();

  const datasets = currentProjectId ? datasetsByProject[currentProjectId] ?? [] : [];
  const activeDataset = datasets.find((dataset) => dataset.id === currentDatasetId);

  return (
    <div className="h-6 bg-[#05080f] text-white/60 flex items-center justify-between px-3 text-[11px] border-t border-white/10">
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-3.5 w-3.5 text-cyan-300" />
        <span>{activeDataset?.name ?? 'No dataset loaded'}</span>
        {activeDataset && (
          <span className="text-white/40">
            {activeDataset.rowCount.toLocaleString()} rows | {activeDataset.columns.length} cols
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 gap-1 text-[11px] text-white/60 hover:text-white"
          onClick={toggleAssistantPanel}
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
