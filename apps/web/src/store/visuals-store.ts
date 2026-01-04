'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SavedChart = {
  id: string;
  title: string;
  spec: Record<string, unknown>;
  createdAt: string;
};

type VisualsState = {
  savedCharts: SavedChart[];
  addChart: (title: string, spec: Record<string, unknown>) => void;
  removeChart: (id: string) => void;
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `chart-${Date.now()}`;

export const useVisualsStore = create<VisualsState>()(
  persist(
    (set) => ({
      savedCharts: [],
      addChart: (title, spec) => {
        const chart: SavedChart = {
          id: generateId(),
          title,
          spec,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ savedCharts: [chart, ...state.savedCharts] }));
      },
      removeChart: (id) => {
        set((state) => ({
          savedCharts: state.savedCharts.filter((chart) => chart.id !== id),
        }));
      },
    }),
    {
      name: 'datacanvas-visuals',
    }
  )
);
