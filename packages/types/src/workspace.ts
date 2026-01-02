// Workspace and UI state types

export interface WorkspaceState {
  projectId: string | null;
  datasetId: string | null;
  datasetVersionId: string | null;
  activeSidebarSection: SidebarSection;
  activeTab: TabType | null;
  openTabs: WorkspaceTab[];
}

export type SidebarSection = 'explorer' | 'charts' | 'profile' | 'settings';

export interface WorkspaceTab {
  id: string;
  type: TabType;
  title: string;
  icon?: string;
  data?: Record<string, unknown>;
  isDirty?: boolean;
  closable?: boolean;
}

export type TabType =
  | 'overview'
  | 'data'
  | 'visuals'
  | 'drift'
  | 'sandbox'
  | 'chart'
  | 'profile';

// Layout state
export interface LayoutState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  bottomPanelOpen: boolean;
  bottomPanelHeight: number;
  assistantPanelOpen: boolean;
  assistantPanelWidth: number;
  activeBottomTab: BottomPanelTab;
}

export type BottomPanelTab = 'jobs' | 'logs' | 'output' | 'problems';

// Explorer tree
export interface ExplorerNode {
  id: string;
  type: 'project' | 'dataset' | 'version' | 'column';
  name: string;
  parentId: string | null;
  children?: ExplorerNode[];
  metadata?: Record<string, unknown>;
  isExpanded?: boolean;
}

// Chat state
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartSpec?: unknown;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  suggestions: string[];
  conversationId: string | null;
}

// Sandbox state
export interface SandboxState {
  code: string;
  isExecuting: boolean;
  output: SandboxOutput[];
  variables: Record<string, SandboxVariable>;
  pyodideReady: boolean;
  error: string | null;
}

export interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'result' | 'chart';
  content: string;
  timestamp: Date;
  chartSpec?: unknown;
}

export interface SandboxVariable {
  name: string;
  type: string;
  shape?: string;
  preview: string;
}

// Detected metrics from sandbox
export interface DetectedMetrics {
  losses?: number[];
  accuracies?: number[];
  epochs?: number[];
  yTrue?: number[];
  yPred?: number[];
  confusionMatrix?: number[][];
  labelDistribution?: Record<string, number>;
}
