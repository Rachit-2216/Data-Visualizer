'use client';

import { useEffect, useMemo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useDatasetStore } from '@/store/dataset-store';
import { useProjectStore } from '@/store/project-store';
import { useVisualsStore } from '@/store/visuals-store';
import { useAuthStore } from '@/store/auth-store';
import { useChat } from '@/hooks/use-chat';
import { DynamicChartGrid } from '@/components/charts/dynamic-chart-generator';
import { InteractiveChartWrapper } from '@/components/charts/interactive-chart-wrapper';
import { Button } from '@/components/ui/button';

export function VisualsTab() {
  const { isLoading, datasetsByProject, currentDatasetId } = useDatasetStore();
  const { currentProjectId } = useProjectStore();
  const { savedCharts, fetchSavedCharts } = useVisualsStore();
  const { user } = useAuthStore();
  const { sendMessage } = useChat();

  useEffect(() => {
    if (!user || !currentProjectId) return;
    fetchSavedCharts(currentProjectId);
  }, [currentProjectId, fetchSavedCharts, user]);

  const dataset = useMemo(() => {
    if (!currentProjectId) return null;
    const list = datasetsByProject[currentProjectId] ?? [];
    return list.find((item) => item.id === currentDatasetId) ?? list[0] ?? null;
  }, [currentDatasetId, currentProjectId, datasetsByProject]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/50">
          <p className="text-lg mb-2">No dataset selected</p>
          <p className="text-sm">Select a dataset to see visualizations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto p-6 space-y-8">
      {savedCharts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Assistant Charts</h2>
              <p className="text-sm text-white/60">Generated from chat</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedCharts.map((chart) => (
              <div
                key={chart.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <InteractiveChartWrapper spec={chart.spec} title={chart.title} />
                <div className="p-3 border-t border-white/10 flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate">{chart.title}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => sendMessage(`Analyze this chart: ${chart.title}`)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-1">
            Auto-Generated Visualizations
          </h2>
          <p className="text-sm text-white/50">
            Charts generated from live sample data and column metadata.
          </p>
        </div>

        <DynamicChartGrid dataset={dataset} maxCharts={60} />
      </section>
    </div>
  );
}
