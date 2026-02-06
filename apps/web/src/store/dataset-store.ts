'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClientOptional } from '@/lib/supabase/client';
import { demoDatasets, type DemoDataset, type DatasetColumn, type DatasetProfile } from '@/lib/demo-data';
import { apiClient, ApiError, type ApiDatasetVersion } from '@/lib/api-client';
import { isUuid } from '@/lib/utils';
import { isOfflineMode } from '@/lib/offline/mode';
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

const createMockProfile = (name: string, columns: DatasetColumn[], rowCount: number): DatasetProfile => ({
  dataset: {
    name,
    version: 1,
    status: 'ready',
    uploadedAt: new Date().toISOString(),
  },
  stats: {
    rowCount,
    columnCount: columns.length,
    memoryMb: Math.max(0.01, +(rowCount * columns.length * 0.000002).toFixed(2)),
    duplicateRows: Math.floor(rowCount * 0.01),
    missingCells: Math.floor(rowCount * columns.length * 0.04),
  },
  warnings: [
    { severity: 'low', message: 'Basic profiling completed with demo statistics' },
  ],
  columnTypes: {
    numeric: columns.filter((col) => col.type === 'numeric').length,
    categorical: columns.filter((col) => col.type === 'categorical').length,
    text: columns.filter((col) => col.type === 'text').length,
    datetime: columns.filter((col) => col.type === 'datetime').length,
    boolean: columns.filter((col) => col.type === 'boolean').length,
  },
});

const normalizeProfile = (profileJson: any): DatasetProfile => {
  const columns = profileJson?.schema?.columns ?? [];
  const inferredCounts = columns.reduce(
    (acc: Record<string, number>, col: { inferred_type?: string }) => {
      const key = col.inferred_type ?? 'text';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return {
    dataset: {
      name: profileJson?.dataset?.name ?? 'Dataset',
      version: profileJson?.dataset?.version ?? 1,
      status: profileJson?.dataset?.status ?? 'ready',
      uploadedAt: profileJson?.dataset?.uploadedAt ?? new Date().toISOString(),
    },
    stats: {
      rowCount: profileJson?.stats?.row_count ?? 0,
      columnCount: profileJson?.stats?.column_count ?? 0,
      memoryMb: profileJson?.stats?.memory_est_mb ?? 0,
      duplicateRows: profileJson?.stats?.duplicate_rows ?? 0,
      missingCells: profileJson?.missing?.total_missing ?? 0,
    },
    warnings: (profileJson?.warnings ?? []).map((warning: any) => ({
      severity: warning.severity ?? 'low',
      message: warning.message ?? 'Warning',
    })),
    columnTypes: {
      numeric: inferredCounts.numeric ?? 0,
      categorical: inferredCounts.categorical ?? 0,
      text: inferredCounts.text ?? 0,
      datetime: inferredCounts.datetime ?? 0,
      boolean: inferredCounts.boolean ?? 0,
    },
  };
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `dataset-${Date.now()}`;

const createPlaceholderDataset = (projectId: string, id: string, name: string, createdAt?: string): Dataset => {
  const columns: DatasetColumn[] = [
    { name: 'column_a', type: 'numeric' },
    { name: 'column_b', type: 'categorical' },
    { name: 'column_c', type: 'numeric' },
  ];
  const rowCount = 1200;
  return {
    id,
    projectId,
    name,
    createdAt: createdAt ?? new Date().toISOString(),
    rowCount,
    columns,
    sampleRows: [
      { column_a: 12, column_b: 'alpha', column_c: 0.42 },
      { column_a: 19, column_b: 'beta', column_c: 0.87 },
    ],
    profile: createMockProfile(name, columns, rowCount),
  };
};

const initialState = {
  datasetsByProject: { ...demoDatasets },
  currentDatasetId: demoDatasets['demo-project']?.[0]?.id ?? null,
  currentDatasetVersionId: demoDatasets['demo-project']?.[0]?.id
    ? `${demoDatasets['demo-project']?.[0]?.id}-v1`
    : null,
  uploadProgress: 0,
  isLoading: false,
  isUploadModalOpen: false,
  error: null,
};

const getLatestVersion = (versions: ApiDatasetVersion[] | undefined) => {
  if (!versions || versions.length === 0) return null;
  return [...versions].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')).pop() ?? null;
};

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set, get) => ({
      ...initialState,
      fetchDatasets: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          if (!isUuid(projectId)) {
            const demoSet = demoDatasets[projectId];
            if (demoSet) {
              set((state) => ({
                datasetsByProject: { ...state.datasetsByProject, [projectId]: demoSet },
                currentDatasetId: state.currentDatasetId ?? demoSet[0]?.id ?? null,
                currentDatasetVersionId:
                  state.currentDatasetVersionId ??
                  (demoSet[0]?.id ? `${demoSet[0]?.id}-v1` : null),
              }));
            }
            return;
          }
          if (isOfflineMode()) {
            const local = get().datasetsByProject[projectId] ?? [];
            const nextDatasetId = get().currentDatasetId ?? local[0]?.id ?? null;
            const currentDataset = local.find((item) => item.id === nextDatasetId);
            set((state) => ({
              datasetsByProject: { ...state.datasetsByProject, [projectId]: local },
              currentDatasetId: nextDatasetId,
              currentDatasetVersionId: currentDataset?.versionId ?? state.currentDatasetVersionId ?? null,
            }));
            return;
          }
          const supabase = createClientOptional();
          const user =
            supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;

          if (!user) {
            const demoSet = demoDatasets[projectId];
            if (demoSet) {
              set((state) => ({
                datasetsByProject: { ...state.datasetsByProject, [projectId]: demoSet },
                currentDatasetId: state.currentDatasetId ?? demoSet[0]?.id ?? null,
                currentDatasetVersionId:
                  state.currentDatasetVersionId ??
                  (demoSet[0]?.id ? `${demoSet[0]?.id}-v1` : null),
              }));
            }
            return;
          }

          const response = await apiClient.listProjectDatasets(projectId);
          const remoteDatasets: Dataset[] = (response.datasets ?? []).map((dataset) => {
            const latest = getLatestVersion(dataset.dataset_versions);
            const rowCount = latest?.row_count ?? latest?.row_count_est ?? 0;
            return {
              id: dataset.id,
              projectId: dataset.project_id,
              name: dataset.name,
              createdAt: dataset.created_at,
              rowCount,
              columns: [],
              sampleRows: [],
              profile: null as unknown as DatasetProfile,
              versionId: latest?.id ?? null,
            };
          });

          const merged = demoDatasets[projectId]
            ? demoDatasets[projectId].concat(remoteDatasets)
            : remoteDatasets;
          const nextDatasetId = get().currentDatasetId ?? merged[0]?.id ?? null;
          const currentDataset = merged.find((item) => item.id === nextDatasetId);
          set((state) => ({
            datasetsByProject: { ...state.datasetsByProject, [projectId]: merged },
            currentDatasetId: nextDatasetId,
            currentDatasetVersionId: currentDataset?.versionId ?? state.currentDatasetVersionId ?? null,
          }));
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Failed to load datasets';
          const demoSet = demoDatasets[projectId];
          if (demoSet) {
            set((state) => ({
              datasetsByProject: { ...state.datasetsByProject, [projectId]: demoSet },
              currentDatasetId: state.currentDatasetId ?? demoSet[0]?.id ?? null,
              currentDatasetVersionId:
                state.currentDatasetVersionId ?? (demoSet[0]?.id ? `${demoSet[0].id}-v1` : null),
              error: message,
            }));
          } else {
            set({ error: message });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      uploadDataset: async (file: File, projectId: string) => {
        set({ uploadProgress: 0, isLoading: true, error: null });

        const progressTimer = window.setInterval(() => {
          set((state) => ({
            uploadProgress: Math.min(95, state.uploadProgress + 8),
          }));
        }, 150);

        const name = file.name.replace(/\.[^.]+$/, '');
        const columns: DatasetColumn[] = [
          { name: 'column_a', type: 'numeric' },
          { name: 'column_b', type: 'categorical' },
          { name: 'column_c', type: 'numeric' },
          { name: 'column_d', type: 'text' },
        ];
        const rowCount = 2500 + Math.floor(Math.random() * 4000);
        let dataset: Dataset = {
          id: generateId(),
          projectId,
          name: name || 'New Dataset',
          createdAt: new Date().toISOString(),
          rowCount,
          columns,
          sampleRows: [
            { column_a: 12, column_b: 'alpha', column_c: 0.42, column_d: 'sample' },
            { column_a: 19, column_b: 'beta', column_c: 0.87, column_d: 'example' },
          ],
          profile: createMockProfile(name || 'New Dataset', columns, rowCount),
        };

        const supabase = createClientOptional();
        const user =
          supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;

        let jobId: string | null = null;
        if (!user || isOfflineMode()) {
          try {
            const parsed = await parseDatasetFile(file);
            const derived = buildOfflineProfile(
              dataset.name,
              parsed.rows,
              parsed.columns,
              parsed.rowCount,
              parsed.sampleNote
            );
            dataset = {
              ...dataset,
              columns: derived.columns,
              sampleRows: derived.sampleRows,
              profile: derived.profile,
              rowCount: derived.profile.stats.rowCount,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to parse dataset locally';
            set({ error: message });
          }
        }
        if (user && isUuid(projectId)) {
          try {
            const extension = file.name.split('.').pop()?.toLowerCase() || 'csv';
            const fileType = ['csv', 'json', 'parquet', 'tsv', 'xlsx'].includes(extension)
              ? extension
              : 'csv';
            const createdDataset = await apiClient.createDataset(projectId, {
              name: dataset.name,
              file_type: fileType,
              original_filename: file.name,
            });
            dataset = {
              ...dataset,
              id: createdDataset.dataset.id,
              createdAt: createdDataset.dataset.created_at,
            };

            const uploadResponse = await apiClient.uploadDataset(dataset.id, file);
            dataset.versionId = uploadResponse.dataset_version_id;
            jobId = uploadResponse.job_id;
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : 'Failed to upload dataset';
            set({ error: message });
          }
        }

        window.clearInterval(progressTimer);
        set((state) => ({
          datasetsByProject: {
            ...state.datasetsByProject,
            [projectId]: [...(state.datasetsByProject[projectId] ?? []), dataset],
          },
          currentDatasetId: dataset.id,
          currentDatasetVersionId: dataset.versionId ?? state.currentDatasetVersionId,
          uploadProgress: 100,
          isLoading: false,
          isUploadModalOpen: false,
        }));

        window.setTimeout(() => {
          set({ uploadProgress: 0 });
        }, 400);

        if (user && jobId && dataset.versionId) {
          const pollJob = async () => {
            try {
              const job = await apiClient.getJob(jobId);
              if (job.job?.status === 'done') {
                await get().fetchDatasetProfile(dataset.id, dataset.versionId ?? '');
                await get().fetchDatasets(projectId);
                return;
              }
              if (job.job?.status === 'failed') {
                return;
              }
              window.setTimeout(pollJob, 2000);
            } catch {
              window.setTimeout(pollJob, 3000);
            }
          };
          pollJob();
        }

        return dataset;
      },
      deleteDataset: async (datasetId: string, projectId: string) => {
        const dataset = (get().datasetsByProject[projectId] ?? []).find(
          (item) => item.id === datasetId
        );
        if (!dataset || dataset.isProtected) {
          return;
        }

        const supabase = createClientOptional();
        const user =
          supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;

        if (user && isUuid(datasetId)) {
          try {
            await apiClient.requestJson(`/api/datasets/${datasetId}`, { method: 'DELETE' });
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : 'Failed to delete dataset';
            set({ error: message });
            return;
          }
        }

        set((state) => {
          const remaining = (state.datasetsByProject[projectId] ?? []).filter(
            (item) => item.id !== datasetId
          );
          return {
            datasetsByProject: { ...state.datasetsByProject, [projectId]: remaining },
            currentDatasetId:
              state.currentDatasetId === datasetId ? remaining[0]?.id ?? null : state.currentDatasetId,
            currentDatasetVersionId:
              state.currentDatasetId === datasetId
                ? remaining[0]?.versionId ?? null
                : state.currentDatasetVersionId,
          };
        });
      },
      selectDataset: (datasetId: string | null) => {
        const datasets = datasetId
          ? Object.values(get().datasetsByProject)
              .flat()
              .filter((item) => item.id === datasetId)
          : [];
        set({
          currentDatasetId: datasetId,
          currentDatasetVersionId: datasets[0]?.versionId ?? (datasetId ? `${datasetId}-v1` : null),
        });
      },
      fetchDatasetProfile: async (datasetId: string, versionId: string) => {
        if (isOfflineMode()) return;
        const supabase = createClientOptional();
        const user =
          supabase && !isOfflineMode() ? (await supabase.auth.getUser()).data.user : null;

        if (!user || !isUuid(datasetId) || !isUuid(versionId)) return;
        try {
          const response = await apiClient.getProfile(versionId);
          if (!response.profile) return;
          const normalized = normalizeProfile(response.profile.profile_json);
          set((state) => {
            const next = { ...state.datasetsByProject };
            Object.keys(next).forEach((projectKey) => {
              next[projectKey] = next[projectKey].map((item) => {
                if (item.id !== datasetId) return item;
                return {
                  ...item,
                  profile: normalized,
                  sampleRows: response.profile?.sample_preview_json ?? [],
                  columns:
                    response.profile?.profile_json?.schema?.columns?.map((col: any) => ({
                      name: col.name,
                      type: col.inferred_type ?? 'text',
                    })) ?? item.columns,
                  rowCount: normalized.stats.rowCount ?? item.rowCount,
                };
              });
            });
            return { datasetsByProject: next };
          });
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Failed to load profile';
          set({ error: message });
        }
      },
      openUploadModal: () => {
        set({ isUploadModalOpen: true });
      },
      closeUploadModal: () => {
        set({ isUploadModalOpen: false });
      },
      clearError: () => {
        set({ error: null });
      },
      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'datacanvas-datasets',
      partialize: (state) => ({
        datasetsByProject: state.datasetsByProject,
        currentDatasetId: state.currentDatasetId,
        currentDatasetVersionId: state.currentDatasetVersionId,
      }),
    }
  )
);
