'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { demoProject, type DemoProject } from '@/lib/demo-data';
import { apiClient, ApiError, type ApiProject } from '@/lib/api-client';
import { isUuid } from '@/lib/utils';

export type Project = DemoProject & {
  isProtected?: boolean;
};

type ProjectState = {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  isCreateModalOpen: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  clearError: () => void;
  reset: () => void;
};

const ensureDemoProject = (projects: Project[]) => {
  const hasDemo = projects.some((project) => project.id === demoProject.id);
  if (hasDemo) {
    return projects.map((project) =>
      project.id === demoProject.id ? { ...project, isProtected: true } : project
    );
  }
  return [{ ...demoProject, isProtected: true }, ...projects];
};

const withDemoFallback = (projects: Project[]) => {
  if (projects.some((project) => project.isProtected)) {
    return projects;
  }
  return ensureDemoProject(projects);
};

const mapRemoteProject = (project: ApiProject): Project => ({
  id: project.id,
  name: project.name,
  createdAt: project.created_at,
  isProtected: project.is_demo,
});

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `project-${Date.now()}`;

const initialState = {
  projects: [{ ...demoProject, isProtected: true }],
  currentProjectId: demoProject.id,
  isLoading: false,
  isCreateModalOpen: false,
  error: null,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialState,
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const response = await apiClient.getProjects();
            const remoteProjects = (response.projects ?? []).map(mapRemoteProject);
            const merged = withDemoFallback(remoteProjects);
            const current = get().currentProjectId;
            const firstRemote = merged.find((project) => isUuid(project.id))?.id;
            const activeId =
              current && merged.some((project) => project.id === current) && isUuid(current)
                ? current
                : firstRemote ?? merged[0]?.id ?? demoProject.id;
            set({ projects: merged, currentProjectId: activeId });
          } else {
            const merged = ensureDemoProject(get().projects);
            const current = get().currentProjectId;
            const activeId =
              current && merged.some((project) => project.id === current)
                ? current
                : merged[0]?.id ?? demoProject.id;
            set({ projects: merged, currentProjectId: activeId });
          }
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Failed to load projects';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },
      createProject: async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return null;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          try {
            const response = await apiClient.createProject({ name: trimmedName });
            const created = mapRemoteProject(response.project);
            set((state) => ({
              projects: withDemoFallback([...state.projects, created]),
              currentProjectId: created.id,
              isCreateModalOpen: false,
            }));
            return created;
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : 'Failed to create project';
            set({ error: message });
            return null;
          }
        }

        const created: Project = {
          id: generateId(),
          name: trimmedName,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: ensureDemoProject([...state.projects, created]),
          currentProjectId: created.id,
          isCreateModalOpen: false,
        }));
        return created;
      },
      deleteProject: async (projectId: string) => {
        const project = get().projects.find((item) => item.id === projectId);
        if (!project || project.isProtected) {
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          try {
            await apiClient.deleteProject(projectId);
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : 'Failed to delete project';
            set({ error: message });
            return;
          }
        }

        set((state) => {
          const nextProjects = state.projects.filter((item) => item.id !== projectId);
          const merged = ensureDemoProject(nextProjects);
          const nextActive =
            state.currentProjectId === projectId
              ? merged[0]?.id ?? demoProject.id
              : state.currentProjectId;
          return {
            projects: merged,
            currentProjectId: nextActive,
          };
        });
      },
      selectProject: (projectId: string) => {
        set({ currentProjectId: projectId });
      },
      openCreateModal: () => {
        set({ isCreateModalOpen: true });
      },
      closeCreateModal: () => {
        set({ isCreateModalOpen: false });
      },
      clearError: () => {
        set({ error: null });
      },
      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'datacanvas-projects',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
