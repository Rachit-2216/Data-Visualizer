'use client';

import { Files, BarChart3, Database, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLayoutStore } from '@/store/layout-store';
import { cn } from '@/lib/utils';

const activities = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'charts', icon: BarChart3, label: 'Charts' },
  { id: 'profile', icon: Database, label: 'Profile' },
] as const;

export function ActivityBar() {
  const {
    activeSidebarSection,
    setActiveSidebarSection,
    sidebarOpen,
    toggleSidebar,
  } = useLayoutStore();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-12 bg-sidebar border-r flex flex-col items-center py-2 gap-1">
        {/* Toggle Sidebar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </TooltipContent>
        </Tooltip>

        <div className="w-6 h-px bg-border my-2" />

        {/* Activity Icons */}
        {activities.map((activity) => (
          <Tooltip key={activity.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 relative',
                  activeSidebarSection === activity.id &&
                    'text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-primary before:rounded-r'
                )}
                onClick={() => {
                  if (!sidebarOpen) {
                    toggleSidebar();
                  }
                  setActiveSidebarSection(activity.id);
                }}
              >
                <activity.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{activity.label}</TooltipContent>
          </Tooltip>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings at bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10',
                activeSidebarSection === 'settings' && 'text-primary'
              )}
              onClick={() => {
                if (!sidebarOpen) {
                  toggleSidebar();
                }
                setActiveSidebarSection('settings');
              }}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
