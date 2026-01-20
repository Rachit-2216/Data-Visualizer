'use client';

import { X, LayoutDashboard, Table, BarChart3, GitCompare, Code2, Network, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/store/workspace-store';
import { cn } from '@/lib/utils';

const tabIcons: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  data: Table,
  visuals: BarChart3,
  drift: GitCompare,
  sandbox: Code2,
  'code-viz': Network,
  chart: BarChart3,
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs, openTab } = useWorkspaceStore();

  const handleDrop = (fromId: string, toId: string) => {
    const fromIndex = tabs.findIndex((tab) => tab.id === fromId);
    const toIndex = tabs.findIndex((tab) => tab.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    reorderTabs(fromIndex, toIndex);
  };

  return (
    <div className="h-10 flex items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl px-2 py-1">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.type] || LayoutDashboard;
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-2 px-3 h-8 rounded-full cursor-pointer select-none border',
              'hover:bg-white/10 transition-colors',
              isActive
                ? 'bg-white/10 border-cyan-300/60 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'border-white/10 text-white/60'
            )}
            onClick={() => setActiveTab(tab.id)}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', tab.id);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const fromId = event.dataTransfer.getData('text/plain');
              if (fromId) handleDrop(fromId, tab.id);
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm whitespace-nowrap">{tab.title}</span>
            {tab.closable !== false && (
              <button
                className={cn(
                  'ml-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-white/10 p-0.5',
                  'transition-opacity'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white"
        onClick={() => openTab({ type: 'chart', title: 'New Chart' })}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
