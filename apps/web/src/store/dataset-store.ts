'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  demoDatasets,
  type DemoDataset,
  type DatasetColumn,
  type DatasetProfile,
} from '@/lib/demo-data';
import { parseDatasetFile } from '@/lib/offline/parser';
import { buildOfflineProfile } from '@/lib/offline/profiler';

export type Dataset = DemoDataset & {
  projectId: string;
  isProtected?: boolean;
  versionId?: string | null;
};

type DatasetState = {
  datasetsByProject: Record<string, Dataset[]>;
  currentDatasetId: string | null;
  currentDatasetVersionId: string | null;
  uploadProgress: number;
  isLoading: boolean;
  isUploadModalOpen: boolean;
  error: string | null;
  fetchDatasets: (projectId: string) => Promise<void>;
  uploadDataset: (file: File, projectId: string) => Promise<Dataset | null>;
  deleteDataset: (datasetId: string, projectId: string) => Promise<void>;
  selectDataset: (datasetId: string | null) => void;
  fetchDatasetProfile: (datasetId: string, versionId: string) => Promise<void>;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  clearError: () => void;
  reset: () => void;
};

const createMockProfile = (
  name: string,
  columns: DatasetColumn[],
  rowCount: number
): DatasetProfile => ({
  dataset: {
    name,
    version: 1,
    status: 'ready',
    uploadedAt: new Date().toISOString(),
  },
  stats: {
    rowCount,
    columnCount: columns.length,
    memoryMb: Math.max(
      0.01,
      +(rowCount * columns.length * 0.000002).toFixed(2)
    ),
    duplicateRows: Math.floor(rowCount * 0.01),
    missingCells: Math.floor(rowCount * columns.length * 0.04),
  },
  warnings: [
    { severity: 'low', message: 'Basic local profiling completed.' },
  ],
  columnTypes: {
    numeric: columns.filter((column) => column.type === 'numeric').length,
    categorical: columns.filter((column) => column.type === 'categorical')
      .length,
    text: columns.filter((column) => column.type === 'text').length,
    datetime: columns.filter((column) => column.type === 'datetime').length,
    boolean: columns.filter((column) => column.type === 'boolean').length,
  },
});

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `dataset-${Date.now()}`;

const normalizeDemoDatasets = (
  projectId: string,
  datasets: DemoDataset[] = []
): Dataset[] =>
  datasets.map((dataset) => ({
    ...dataset,
    projectId,
    isProtected: true,
    versionId: `${dataset.id}-v1`,
  }));

const mergeProjectDatasets = (
  projectId: string,
  existing: Dataset[] = []
) => {
  const merged = new Map<string, Dataset>();

  normalizeDemoDatasets(projectId, demoDatasets[projectId]).forEach(
    (dataset) => merged.set(dataset.id, dataset)
  );
  existing.forEach((dataset) =>
    merged.set(dataset.id, { ...dataset, projectId })
  );

  return Array.from(merged.values());
};

const initialDemoDatasets = Object.fromEntries(
  Object.entries(demoDatasets).map(([projectId, datasets]) => [
    projectId,
    normalizeDemoDatasets(projectId, datasets),
  ])
) as Record<string, Dataset[]>;

const initialDataset = initialDemoDatasets['demo-project']?.[0] ?? null;

const initialState = {
  datasetsByProject: initialDemoDatasets,
  currentDatasetId: initialDataset?.id ?? null,
  currentDatasetVersionId: initialDataset?.versionId ?? null,
  uploadProgress: 0,
  isLoading: false,
  isUploadModalOpen: false,
  error: null,
};

const datasetsForPersistence = (
  datasetsByProject: Record<string, Dataset[]>
) =>
  Object.fromEntries(
    Object.entries(datasetsByProject).map(([projectId, datasets]) => [
      projectId,
      datasets.map((dataset) => ({
        ...dataset,
        sampleRows: dataset.sampleRows.slice(0, 750),
      })),
    ])
  );

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set, get) => ({
      ...initialState,
      fetchDatasets: async (projectId) => {
        set({ isLoading: true, error: null });

        const datasets = mergeProjectDatasets(
          projectId,
          get().datasetsByProject[projectId]
        );
        const currentDataset =
          datasets.find((dataset) => dataset.id === get().currentDatasetId) ??
          datasets[0] ??
          null;

        set((state) => ({
          datasetsByProject: {
            ...state.datasetsByProject,
            [projectId]: datasets,
          },
          currentDatasetId: currentDataset?.id ?? null,
          currentDatasetVersionId:
            currentDataset?.versionId ??
            (currentDataset ? `${currentDataset.id}-v1` : null),
          isLoading: false,
        }));
      },
      uploadDataset: async (file, projectId) => {
        set({ uploadProgress: 2, isLoading: true, error: null });

        const progressTimer = window.setInterval(() => {
          set((state) => ({
            uploadProgress: Math.min(92, state.uploadProgress + 7),
          }));
        }, 120);

        try {
          const parsed = await parseDatasetFile(file);
          const name = file.name.replace(/\.[^.]+$/, '') || 'New Dataset';
          const id = generateId();
          const derived = buildOfflineProfile(
            name,
            parsed.rows,
            parsed.columns,
            parsed.rowCount,
            parsed.sampleNote
          );
          const dataset: Dataset = {
            id,
            projectId,
            name,
            createdAt: new Date().toISOString(),
            rowCount: derived.profile.stats.rowCount,
            columns: derived.columns,
            sampleRows: derived.sampleRows,
            profile: derived.profile,
            versionId: `${id}-v1`,
          };

          window.clearInterval(progressTimer);
          set((state) => ({
            datasetsByProject: {
              ...state.datasetsByProject,
              [projectId]: [
                ...(state.datasetsByProject[projectId] ?? []),
                dataset,
              ],
            },
            currentDatasetId: dataset.id,
            currentDatasetVersionId: dataset.versionId ?? `${dataset.id}-v1`,
            uploadProgress: 100,
            isLoading: false,
            isUploadModalOpen: false,
            error: null,
          }));

          window.setTimeout(() => set({ uploadProgress: 0 }), 400);
          return dataset;
        } catch (error) {
          window.clearInterval(progressTimer);
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to parse the dataset locally.';
          set({
            error: message,
            uploadProgress: 0,
            isLoading: false,
          });
          return null;
        }
      },
      deleteDataset: async (datasetId, projectId) => {
        const dataset = (get().datasetsByProject[projectId] ?? []).find(
          (item) => item.id === datasetId
        );
        if (!dataset || dataset.isProtected) return;

        set((state) => {
          const remaining = (
            state.datasetsByProject[projectId] ?? []
          ).filter((item) => item.id !== datasetId);
          const nextDataset =
            state.currentDatasetId === datasetId
              ? remaining[0] ?? null
              : remaining.find(
                  (item) => item.id === state.currentDatasetId
                ) ?? null;

          return {
            datasetsByProject: {
              ...state.datasetsByProject,
              [projectId]: remaining,
            },
            currentDatasetId: nextDataset?.id ?? null,
            currentDatasetVersionId:
              nextDataset?.versionId ??
              (nextDataset ? `${nextDataset.id}-v1` : null),
          };
        });
      },
      selectDataset: (datasetId) => {
        const dataset = datasetId
          ? Object.values(get().datasetsByProject)
              .flat()
              .find((item) => item.id === datasetId)
          : null;
        set({
          currentDatasetId: datasetId,
          currentDatasetVersionId:
            dataset?.versionId ?? (datasetId ? `${datasetId}-v1` : null),
        });
      },
      fetchDatasetProfile: async () => {
        // Local uploads are profiled during parsing, so there is nothing to poll.
      },
      openUploadModal: () => set({ isUploadModalOpen: true }),
      closeUploadModal: () => set({ isUploadModalOpen: false }),
      clearError: () => set({ error: null }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'datacanvas-datasets',
      partialize: (state) => ({
        datasetsByProject: datasetsForPersistence(state.datasetsByProject),
        currentDatasetId: state.currentDatasetId,
        currentDatasetVersionId: state.currentDatasetVersionId,
      }),
    }
  )
);
