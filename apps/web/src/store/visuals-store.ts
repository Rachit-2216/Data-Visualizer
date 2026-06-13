'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useVisualsStore = create<VisualsState>()(
  persist(
    (set) => ({
      savedCharts: [],
      isLoading: false,
      error: null,
      fetchSavedCharts: async () => {
        set({ isLoading: false, error: null });
      },
      addChart: async (title, spec, options) => {
        const chart: SavedChart = {
          id: generateId(),
          title,
          spec,
          createdAt: new Date().toISOString(),
          projectId: options?.projectId,
          datasetVersionId: options?.datasetVersionId,
          chartType: options?.chartType,
          isRemote: false,
        };
        set((state) => ({ savedCharts: [chart, ...state.savedCharts] }));
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
