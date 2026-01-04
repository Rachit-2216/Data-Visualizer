'use client';

import {
  Files,
  BarChart3,
  Database,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
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
    assistantPanelOpen,
    toggleAssistantPanel,
  } = useLayoutStore();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-12 bg-[#060a12] border-r border-white/10 flex flex-col items-center py-2 gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white/70"
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

        <div className="w-6 h-px bg-white/10 my-2" />

        {activities.map((activity) => (
          <Tooltip key={activity.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 relative text-white/60',
                  activeSidebarSection === activity.id &&
                    'text-cyan-200 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-6 before:bg-cyan-300 before:rounded-r'
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

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 text-white/60',
                assistantPanelOpen && 'text-cyan-200'
              )}
              onClick={toggleAssistantPanel}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {assistantPanelOpen ? 'Hide Assistant' : 'Show Assistant'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 text-white/60',
                activeSidebarSection === 'settings' && 'text-cyan-200'
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
