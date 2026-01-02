import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeSidebarSection: 'explorer' | 'charts' | 'profile' | 'settings';

  // Bottom panel
  bottomPanelOpen: boolean;
  bottomPanelHeight: number;
  activeBottomTab: 'jobs' | 'logs' | 'output' | 'problems';

  // Assistant panel
  assistantPanelOpen: boolean;
  assistantPanelWidth: number;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setActiveSidebarSection: (section: 'explorer' | 'charts' | 'profile' | 'settings') => void;

  toggleBottomPanel: () => void;
  setBottomPanelHeight: (height: number) => void;
  setActiveBottomTab: (tab: 'jobs' | 'logs' | 'output' | 'problems') => void;

  toggleAssistantPanel: () => void;
  setAssistantPanelWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarWidth: 260,
      activeSidebarSection: 'explorer',

      bottomPanelOpen: false,
      bottomPanelHeight: 200,
      activeBottomTab: 'jobs',

      assistantPanelOpen: true,
      assistantPanelWidth: 320,

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setActiveSidebarSection: (section) => set({ activeSidebarSection: section }),

      toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),

      toggleAssistantPanel: () =>
        set((state) => ({ assistantPanelOpen: !state.assistantPanelOpen })),
      setAssistantPanelWidth: (width) => set({ assistantPanelWidth: width }),
    }),
    {
      name: 'datacanvas-layout',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        bottomPanelOpen: state.bottomPanelOpen,
        bottomPanelHeight: state.bottomPanelHeight,
        assistantPanelOpen: state.assistantPanelOpen,
        assistantPanelWidth: state.assistantPanelWidth,
      }),
    }
  )
);
