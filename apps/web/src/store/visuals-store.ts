'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClientOptional } from '@/lib/supabase/client';
import { apiClient, ApiError } from '@/lib/api-client';
import { isUuid } from '@/lib/utils';
import { isOfflineMode } from '@/lib/offline/mode';

export type SavedChart = {
  id: string;
  title: string;
  spec: Record<string, unknown>;
  createdAt: string;
  projectId?: string;
  datasetVersionId?: string | null;
  chartType?: string;
  isRemote?: boolean;
};

type VisualsState = {
  savedCharts: SavedChart[];
  isLoading: boolean;
  error: string | null;
  fetchSavedCharts: (projectId: string) => Promise<void>;
  addChart: (
    title: string,
    spec: Record<string, unknown>,
    options?: { projectId?: string; datasetVersionId?: string | null; chartType?: string }
  ) => Promise<void>;
  removeChart: (id: string) => void;
  clearError: () => void;
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `chart-${Date.now()}`;

const mapRemoteChart = (chart: {
  id: string;
  name: string;
  vega_spec: Record<string, unknown>;
  created_at: string;
  project_id: string;
  dataset_version_id: string | null;
  chart_type: string;
}): SavedChart => ({
  id: chart.id,
  title: chart.name,
  spec: chart.vega_spec,
  createdAt: chart.created_at,
  projectId: chart.project_id,
  datasetVersionId: chart.dataset_version_id,
  chartType: chart.chart_type,
  isRemote: true,
});

export const useVisualsStore = create<VisualsState>()(
  persist(
    (set, get) => ({
      savedCharts: [],
      isLoading: false,
      error: null,
      fetchSavedCharts: async (projectId: string) => {
        if (!isUuid(projectId)) return;
        set({ isLoading: true, error: null });
        try {
          if (isOfflineMode()) {
            set({ isLoading: false });
            return;
          }
          const supabase = createClientOptional();
          const user =
            supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;
          if (!user) {
            set({ isLoading: false });
            return;
          }
          const response = await apiClient.listSavedVisuals(projectId);
          const mapped = (response.visualizations ?? []).map(mapRemoteChart);
          set({ savedCharts: mapped, isLoading: false });
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Failed to load saved visuals';
          set({ error: message, isLoading: false });
        }
      },
      addChart: async (title, spec, options) => {
        const fallbackChart: SavedChart = {
          id: generateId(),
          title,
          spec,
          createdAt: new Date().toISOString(),
          projectId: options?.projectId,
          datasetVersionId: options?.datasetVersionId,
          chartType: options?.chartType,
          isRemote: false,
        };

        try {
          const supabase = createClientOptional();
          const user =
            supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;

          if (user && options?.projectId && isUuid(options.projectId)) {
            const response = await apiClient.saveVisualization({
              project_id: options.projectId,
              dataset_version_id: options.datasetVersionId ?? null,
              name: title,
              chart_type: options.chartType ?? 'custom',
              vega_spec: spec,
            });
            const saved = mapRemoteChart(response.visualization);
            set((state) => ({ savedCharts: [saved, ...state.savedCharts] }));
            return;
          }
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Failed to save visualization';
          set({ error: message });
        }

        set((state) => ({ savedCharts: [fallbackChart, ...state.savedCharts] }));
      },
      removeChart: (id) => {
        set((state) => ({
          savedCharts: state.savedCharts.filter((chart) => chart.id !== id),
        }));
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'datacanvas-visuals',
      partialize: (state) => ({
        savedCharts: state.savedCharts,
      }),
    }
  )
);
