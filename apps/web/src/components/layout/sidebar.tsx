'use client';

import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileSpreadsheet,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayoutStore } from '@/store/layout-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import { useWorkspaceStore } from '@/store/workspace-store';

function getColumnIcon(type: string) {
  switch (type) {
    case 'numeric':
      return Hash;
    case 'categorical':
      return Type;
    case 'datetime':
      return Calendar;
    case 'boolean':
      return ToggleLeft;
    case 'id':
      return Hash;
    default:
      return Type;
  }
}

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { activeSidebarSection, setActiveSidebarSection } = useLayoutStore();
  const { openCreateModal, fetchProjects, currentProjectId } = useProjectStore();
  const { fetchDatasets, openUploadModal } = useDatasetStore();

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-2 gap-2 text-white">
        <button
          className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-xs transition-colors hover:bg-white/10 hover:border-cyan-300/40"
          onClick={() => setActiveSidebarSection('explorer')}
        >
          Ex
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-xs transition-colors hover:bg-white/10 hover:border-cyan-300/40"
          onClick={() => setActiveSidebarSection('charts')}
        >
          Ch
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-xs transition-colors hover:bg-white/10 hover:border-cyan-300/40"
          onClick={() => setActiveSidebarSection('profile')}
        >
          Pr
        </button>
        <button
          className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-xs transition-colors hover:bg-white/10 hover:border-cyan-300/40"
          onClick={() => setActiveSidebarSection('settings')}
        >
          St
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#060a12]/90 text-white backdrop-blur-xl">
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
          {activeSidebarSection === 'explorer' && 'Explorer'}
          {activeSidebarSection === 'charts' && 'Saved Charts'}
          {activeSidebarSection === 'profile' && 'Data Profile'}
          {activeSidebarSection === 'settings' && 'Settings'}
        </span>
        <div className="flex items-center gap-1">
          {activeSidebarSection === 'explorer' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/60"
                onClick={openCreateModal}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white/60"
                onClick={() => {
                  fetchProjects();
                  if (currentProjectId) {
                    fetchDatasets(currentProjectId);
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activeSidebarSection === 'explorer' && <ExplorerContent />}
        {activeSidebarSection === 'charts' && <ChartsContent />}
        {activeSidebarSection === 'profile' && <ProfileContent />}
        {activeSidebarSection === 'settings' && <SettingsContent />}
      </ScrollArea>
    </div>
  );
}

function ExplorerContent() {
  const { projects, currentProjectId, selectProject } = useProjectStore();
  const { datasetsByProject, currentDatasetId, selectDataset, openUploadModal } =
    useDatasetStore();
  const { setProject, setDataset } = useWorkspaceStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    setExpandedItems((prev) => {
      const next = [...prev];
      if (currentProjectId && !next.includes(currentProjectId)) {
        next.push(currentProjectId);
      }
      if (currentDatasetId && !next.includes(currentDatasetId)) {
        next.push(currentDatasetId);
      }
      const versionId = currentDatasetId ? `${currentDatasetId}-v1` : null;
      if (versionId && !next.includes(versionId)) {
        next.push(versionId);
      }
      return next;
    });
  }, [currentDatasetId, currentProjectId]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    setProject(projectId);
    toggleItem(projectId);
  };

  const handleDatasetClick = (datasetId: string) => {
    selectDataset(datasetId);
    setDataset(datasetId, `${datasetId}-v1`);
    toggleItem(datasetId);
  };

  const datasets = currentProjectId ? datasetsByProject[currentProjectId] ?? [] : [];

  return (
    <div className="py-2">
      {projects.map((project) => (
        <div key={project.id}>
          <button
            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-white/5 text-sm"
            onClick={() => handleProjectClick(project.id)}
          >
            {expandedItems.includes(project.id) ? (
              <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
            )}
            {expandedItems.includes(project.id) ? (
              <FolderOpen className="h-4 w-4 text-amber-300 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-300 shrink-0" />
            )}
            <span className="truncate text-white/80">{project.name}</span>
          </button>

          {expandedItems.includes(project.id) && project.id === currentProjectId && (
            <div className="ml-4">
              {datasets.map((dataset) => (
                <div key={dataset.id}>
                  <button
                    className="w-full flex items-center gap-1 px-2 py-1 hover:bg-white/5 text-sm"
                    onClick={() => handleDatasetClick(dataset.id)}
                  >
                    {expandedItems.includes(dataset.id) ? (
                      <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
                    )}
                    <FileSpreadsheet className="h-4 w-4 text-cyan-300 shrink-0" />
                    <span className="truncate text-white/80">{dataset.name}</span>
                  </button>

                  {expandedItems.includes(dataset.id) && (
                    <div className="ml-4">
                      {[{ id: `${dataset.id}-v1`, version: 1 }].map((version) => (
                        <div key={version.id}>
                          <button
                            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-white/5 text-sm text-white/60"
                            onClick={() => toggleItem(version.id)}
                          >
                            {expandedItems.includes(version.id) ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                            <span>v{version.version}</span>
                            <span className="text-xs">({dataset.columns.length} cols)</span>
                          </button>

                          {expandedItems.includes(version.id) && (
                            <div className="ml-6">
                              {dataset.columns.map((column) => {
                                const Icon = getColumnIcon(column.type);
                                return (
                                  <div
                                    key={column.name}
                                    className="flex items-center gap-2 px-2 py-0.5 text-sm text-white/60 hover:bg-white/5 cursor-pointer"
                                  >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{column.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {projects.length === 0 && (
        <div className="px-4 py-3 text-xs text-white/50">No projects yet.</div>
      )}
      {currentProjectId && datasets.length === 0 && (
        <div className="px-4 py-3 text-xs text-white/50">
          No datasets.{' '}
          <button className="text-cyan-300 hover:text-cyan-200" onClick={openUploadModal}>
            Upload one
          </button>
          .
        </div>
      )}
    </div>
  );
}

function ChartsContent() {
  return (
    <div className="p-4 text-center text-sm text-white/60">
      <p>No saved charts yet.</p>
      <p className="mt-2">Create charts in the Visuals tab and save them here.</p>
    </div>
  );
}

function ProfileContent() {
  return (
    <div className="p-4 text-center text-sm text-white/60">
      <p>Select a dataset to view its profile.</p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="p-4 space-y-4 text-white">
      <div>
        <h3 className="text-sm font-medium mb-2">Appearance</h3>
        <Button variant="outline" size="sm" className="w-full justify-start border-white/10">
          Theme: Dark Orbit
        </Button>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Data</h3>
        <Button variant="outline" size="sm" className="w-full justify-start border-white/10">
          Sample size: 50,000 rows
        </Button>
      </div>
    </div>
  );
}
