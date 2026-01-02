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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayoutStore } from '@/store/layout-store';
import { cn } from '@/lib/utils';

// Mock data for explorer
const mockExplorerData = {
  projects: [
    {
      id: 'p1',
      name: 'Demo Project',
      datasets: [
        {
          id: 'd1',
          name: 'Titanic Dataset',
          versions: [
            {
              id: 'v1',
              version: 1,
              columns: [
                { name: 'PassengerId', type: 'id' },
                { name: 'Survived', type: 'categorical' },
                { name: 'Pclass', type: 'categorical' },
                { name: 'Name', type: 'text' },
                { name: 'Sex', type: 'categorical' },
                { name: 'Age', type: 'numeric' },
                { name: 'SibSp', type: 'numeric' },
                { name: 'Parch', type: 'numeric' },
                { name: 'Fare', type: 'numeric' },
              ],
            },
          ],
        },
        {
          id: 'd2',
          name: 'Iris Dataset',
          versions: [
            {
              id: 'v2',
              version: 1,
              columns: [
                { name: 'sepal_length', type: 'numeric' },
                { name: 'sepal_width', type: 'numeric' },
                { name: 'petal_length', type: 'numeric' },
                { name: 'petal_width', type: 'numeric' },
                { name: 'species', type: 'categorical' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

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

export function Sidebar() {
  const { activeSidebarSection } = useLayoutStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {activeSidebarSection === 'explorer' && 'Explorer'}
          {activeSidebarSection === 'charts' && 'Saved Charts'}
          {activeSidebarSection === 'profile' && 'Data Profile'}
          {activeSidebarSection === 'settings' && 'Settings'}
        </span>
        <div className="flex items-center gap-1">
          {activeSidebarSection === 'explorer' && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['p1', 'd1', 'v1'])
  );

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="py-2">
      {mockExplorerData.projects.map((project) => (
        <div key={project.id}>
          {/* Project */}
          <button
            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent text-sm"
            onClick={() => toggleItem(project.id)}
          >
            {expandedItems.has(project.id) ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {expandedItems.has(project.id) ? (
              <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
            )}
            <span className="truncate">{project.name}</span>
          </button>

          {/* Datasets */}
          {expandedItems.has(project.id) && (
            <div className="ml-4">
              {project.datasets.map((dataset) => (
                <div key={dataset.id}>
                  <button
                    className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent text-sm"
                    onClick={() => toggleItem(dataset.id)}
                  >
                    {expandedItems.has(dataset.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <FileSpreadsheet className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="truncate">{dataset.name}</span>
                  </button>

                  {/* Versions and Columns */}
                  {expandedItems.has(dataset.id) && (
                    <div className="ml-4">
                      {dataset.versions.map((version) => (
                        <div key={version.id}>
                          <button
                            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent text-sm text-muted-foreground"
                            onClick={() => toggleItem(version.id)}
                          >
                            {expandedItems.has(version.id) ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                            <span>v{version.version}</span>
                            <span className="text-xs">({version.columns.length} cols)</span>
                          </button>

                          {/* Columns */}
                          {expandedItems.has(version.id) && (
                            <div className="ml-6">
                              {version.columns.map((column) => {
                                const Icon = getColumnIcon(column.type);
                                return (
                                  <div
                                    key={column.name}
                                    className="flex items-center gap-2 px-2 py-0.5 text-sm text-muted-foreground hover:bg-accent cursor-pointer"
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
    </div>
  );
}

function ChartsContent() {
  return (
    <div className="p-4 text-center text-sm text-muted-foreground">
      <p>No saved charts yet.</p>
      <p className="mt-2">Create charts in the Visuals tab and save them here.</p>
    </div>
  );
}

function ProfileContent() {
  return (
    <div className="p-4 text-center text-sm text-muted-foreground">
      <p>Select a dataset to view its profile.</p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Appearance</h3>
        <Button variant="outline" size="sm" className="w-full justify-start">
          Theme: Light
        </Button>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Data</h3>
        <Button variant="outline" size="sm" className="w-full justify-start">
          Sample size: 50,000 rows
        </Button>
      </div>
    </div>
  );
}
