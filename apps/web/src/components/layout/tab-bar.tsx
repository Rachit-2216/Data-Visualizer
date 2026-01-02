'use client';

import { X, LayoutDashboard, Table, BarChart3, GitCompare, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/store/workspace-store';
import { cn } from '@/lib/utils';

const tabIcons: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  data: Table,
  visuals: BarChart3,
  drift: GitCompare,
  sandbox: Code2,
  chart: BarChart3,
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();

  return (
    <div className="h-9 bg-muted/30 border-b flex items-center overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.type] || LayoutDashboard;
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-2 px-3 h-full border-r cursor-pointer select-none',
              'hover:bg-muted/50 transition-colors',
              isActive
                ? 'bg-background border-b-2 border-b-primary text-foreground'
                : 'text-muted-foreground'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm whitespace-nowrap">{tab.title}</span>
            {tab.closable !== false && (
              <button
                className={cn(
                  'ml-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted p-0.5',
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

      {/* Empty space to fill rest of tab bar */}
      <div className="flex-1 border-b" />
    </div>
  );
}
