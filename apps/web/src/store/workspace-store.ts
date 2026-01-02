import { create } from 'zustand';

interface Tab {
  id: string;
  type: 'overview' | 'data' | 'visuals' | 'drift' | 'sandbox' | 'chart';
  title: string;
  icon?: string;
  closable?: boolean;
}

interface WorkspaceState {
  // Current context
  projectId: string | null;
  datasetId: string | null;
  datasetVersionId: string | null;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;

  // Loading states
  isLoadingProfile: boolean;
  isLoadingData: boolean;

  // Actions
  setProject: (projectId: string | null) => void;
  setDataset: (datasetId: string | null, versionId?: string | null) => void;
  setDatasetVersion: (versionId: string | null) => void;

  // Tab actions
  openTab: (tab: Omit<Tab, 'id'>) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;

  // Loading actions
  setLoadingProfile: (loading: boolean) => void;
  setLoadingData: (loading: boolean) => void;

  // Initialize workspace with default tabs
  initializeWorkspace: () => void;
}

const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  projectId: null,
  datasetId: null,
  datasetVersionId: null,

  tabs: [],
  activeTabId: null,

  isLoadingProfile: false,
  isLoadingData: false,

  // Actions
  setProject: (projectId) => set({ projectId }),

  setDataset: (datasetId, versionId) =>
    set({
      datasetId,
      datasetVersionId: versionId ?? null,
    }),

  setDatasetVersion: (versionId) => set({ datasetVersionId: versionId }),

  openTab: (tab) => {
    const id = generateTabId();
    const newTab: Tab = { ...tab, id, closable: tab.closable ?? true };

    set((state) => {
      // Check if tab of same type already exists
      const existingTab = state.tabs.find((t) => t.type === tab.type);
      if (existingTab) {
        return { activeTabId: existingTab.id };
      }

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: id,
      };
    });

    return id;
  },

  closeTab: (id) => {
    set((state) => {
      const tabIndex = state.tabs.findIndex((t) => t.id === id);
      if (tabIndex === -1) return state;

      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveTabId = state.activeTabId;

      // If closing active tab, activate adjacent tab
      if (state.activeTabId === id) {
        if (newTabs.length === 0) {
          newActiveTabId = null;
        } else if (tabIndex >= newTabs.length) {
          newActiveTabId = newTabs[newTabs.length - 1].id;
        } else {
          newActiveTabId = newTabs[tabIndex].id;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveTabId };
    });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newTabs = [...state.tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return { tabs: newTabs };
    });
  },

  setLoadingProfile: (loading) => set({ isLoadingProfile: loading }),
  setLoadingData: (loading) => set({ isLoadingData: loading }),

  initializeWorkspace: () => {
    const state = get();
    if (state.tabs.length === 0) {
      const overviewId = generateTabId();
      set({
        tabs: [
          { id: overviewId, type: 'overview', title: 'Overview', closable: false },
          { id: generateTabId(), type: 'data', title: 'Data', closable: false },
          { id: generateTabId(), type: 'visuals', title: 'Visuals', closable: false },
          { id: generateTabId(), type: 'sandbox', title: 'Sandbox', closable: false },
        ],
        activeTabId: overviewId,
      });
    }
  },
}));
