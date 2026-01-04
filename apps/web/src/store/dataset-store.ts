'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { demoDatasets, type DemoDataset, type DatasetColumn, type DatasetProfile } from '@/lib/demo-data';
import { apiJson, apiUpload } from '@/lib/api-client';

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
  fetchDatasets: (projectId: string) => Promise<void>;
  uploadDataset: (file: File, projectId: string) => Promise<Dataset | null>;
  deleteDataset: (datasetId: string, projectId: string) => Promise<void>;
  selectDataset: (datasetId: string | null) => void;
  fetchDatasetProfile: (datasetId: string, versionId: string) => Promise<void>;
  openUploadModal: () => void;
  closeUploadModal: () => void;
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
};

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set, get) => ({
      ...initialState,
      fetchDatasets: async (projectId: string) => {
        set({ isLoading: true });
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

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

          const response = await apiJson<{ datasets: Array<{ id: string; name: string; created_at: string; project_id: string }> }>(
            `/api/projects/${projectId}/datasets`
          );
          const remoteDatasets: Dataset[] = await Promise.all(
            response.datasets.map(async (dataset) => {
              const versionsResponse = await apiJson<{ versions: Array<{ id: string; row_count_est: number | null; column_count_est: number | null; created_at: string }> }>(
                `/api/datasets/${dataset.id}/versions`
              );
              const latest = versionsResponse.versions?.[versionsResponse.versions.length - 1];
              return {
                id: dataset.id,
                projectId: dataset.project_id,
                name: dataset.name,
                createdAt: dataset.created_at,
                rowCount: latest?.row_count_est ?? 0,
                columns: [],
                sampleRows: [],
                profile: null as unknown as DatasetProfile,
                versionId: latest?.id ?? null,
              };
            })
          );

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
        } finally {
          set({ isLoading: false });
        }
      },
      uploadDataset: async (file: File, projectId: string) => {
        set({ uploadProgress: 0, isLoading: true });

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

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let jobId: string | null = null;
        if (user) {
          const createdDataset = await apiJson<{ dataset: { id: string; created_at: string } }>(
            `/api/projects/${projectId}/datasets`,
            {
              method: 'POST',
              body: JSON.stringify({ name: dataset.name }),
            }
          );
          dataset = {
            ...dataset,
            id: createdDataset.dataset.id,
            createdAt: createdDataset.dataset.created_at,
          };

          const formData = new FormData();
          formData.append('file', file);
          const uploadResponse = await apiUpload<{ dataset_version_id: string; job_id: string }>(
            `/api/datasets/${dataset.id}/upload`,
            formData
          );
          dataset.versionId = uploadResponse.dataset_version_id;
          jobId = uploadResponse.job_id;
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
              const job = await apiJson<{ job: { status: string } }>(`/api/jobs/${jobId}`);
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

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await apiJson(`/api/datasets/${datasetId}`, { method: 'DELETE' });
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
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        const response = await apiJson<{ profile: { profile_json: any; sample_preview_json: Array<Record<string, unknown>> } | null }>(
          `/api/datasets/versions/${versionId}/profile`
        );
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
      },
      openUploadModal: () => {
        set({ isUploadModalOpen: true });
      },
      closeUploadModal: () => {
        set({ isUploadModalOpen: false });
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
