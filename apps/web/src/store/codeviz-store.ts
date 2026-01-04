'use client';

import { create } from 'zustand';
import type { LayerNode, ParsedModel } from '@/lib/code-parser/model-types';

export type CodeVizMode = 'graph' | 'stack' | '3d';
export type ModelType =
  | 'neural'
  | 'regression'
  | 'logistic'
  | 'kmeans'
  | 'pca'
  | 'tree';

type CodeVizState = {
  code: string;
  parsed: ParsedModel;
  selectedLayerId: string | null;
  mode: CodeVizMode;
  modelType: ModelType;
  isAnimating: boolean;
  setCode: (code: string) => void;
  setParsed: (parsed: ParsedModel) => void;
  setSelectedLayer: (id: string | null) => void;
  setMode: (mode: CodeVizMode) => void;
  setModelType: (type: ModelType) => void;
  toggleAnimation: () => void;
  reorderLayers: (from: number, to: number) => void;
};

const emptyParsed: ParsedModel = { layers: [], errors: [] };

export const useCodeVizStore = create<CodeVizState>((set) => ({
  code: '',
  parsed: emptyParsed,
  selectedLayerId: null,
  mode: 'graph',
  modelType: 'neural',
  isAnimating: true,
  setCode: (code) => set({ code }),
  setParsed: (parsed) => set({ parsed }),
  setSelectedLayer: (id) => set({ selectedLayerId: id }),
  setMode: (mode) => set({ mode }),
  setModelType: (modelType) => set({ modelType }),
  toggleAnimation: () => set((state) => ({ isAnimating: !state.isAnimating })),
  reorderLayers: (from, to) =>
    set((state) => {
      const next = [...state.parsed.layers];
      if (from < 0 || to < 0 || from >= next.length || to >= next.length) {
        return state;
      }
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { parsed: { ...state.parsed, layers: next }, selectedLayerId: moved.id };
    }),
}));

export const selectLayerById = (layers: LayerNode[], id: string | null) =>
  id ? layers.find((layer) => layer.id === id) ?? null : null;

