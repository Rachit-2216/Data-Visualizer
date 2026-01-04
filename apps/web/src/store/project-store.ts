'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { demoProject, type DemoProject } from '@/lib/demo-data';
import { apiJson } from '@/lib/api-client';

export type Project = DemoProject & {
  isProtected?: boolean;
};

type ProjectState = {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  isCreateModalOpen: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
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

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `project-${Date.now()}`;

const initialState = {
  projects: [{ ...demoProject, isProtected: true }],
  currentProjectId: demoProject.id,
  isLoading: false,
  isCreateModalOpen: false,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialState,
      fetchProjects: async () => {
        set({ isLoading: true });
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const response = await apiJson<{ projects: Array<{ id: string; name: string; created_at: string }> }>(
              '/api/projects'
            );
            const remoteProjects: Project[] = response.projects.map((project) => ({
              id: project.id,
              name: project.name,
              createdAt: project.created_at,
            }));
            const merged = ensureDemoProject(remoteProjects);
            const current = get().currentProjectId;
            const activeId =
              current && merged.some((project) => project.id === current)
                ? current
                : merged[0]?.id ?? demoProject.id;
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
          const response = await apiJson<{ project: { id: string; name: string; created_at: string } }>(
            '/api/projects',
            {
              method: 'POST',
              body: JSON.stringify({ name: trimmedName }),
            }
          );
          const created: Project = {
            id: response.project.id,
            name: response.project.name,
            createdAt: response.project.created_at,
          };
          set((state) => ({
            projects: ensureDemoProject([...state.projects, created]),
            currentProjectId: created.id,
            isCreateModalOpen: false,
          }));
          return created;
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
          await apiJson(`/api/projects/${projectId}`, { method: 'DELETE' });
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
