'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoProject, type DemoProject } from '@/lib/demo-data';

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
        const projects = ensureDemoProject(get().projects);
        const current = get().currentProjectId;
        const currentProjectId =
          current && projects.some((project) => project.id === current)
            ? current
            : projects[0]?.id ?? demoProject.id;
        set({ projects, currentProjectId, isLoading: false });
      },
      createProject: async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return null;
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
