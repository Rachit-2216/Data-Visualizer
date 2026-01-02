'use client';

import {
  ChevronDown,
  Upload,
  Download,
  Search,
  Settings,
  User,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/store/workspace-store';

export function TopBar() {
  return (
    <div className="h-12 bg-background border-b flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">DataCanvas</span>
        </div>

        {/* Project Selector */}
        <ProjectSelector />

        {/* Dataset Selector */}
        <DatasetSelector />
      </div>

      {/* Center section - Command Palette trigger */}
      <div className="flex-1 flex justify-center max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full max-w-sm justify-start text-muted-foreground h-8"
          onClick={() => {
            // TODO: Open command palette
          }}
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Search or type a command...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}

function ProjectSelector() {
  const { projectId } = useWorkspaceStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <span className="text-muted-foreground text-xs">Project:</span>
          <span className="font-medium">{projectId ? 'My Project' : 'Select Project'}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem>
          <span>My Project</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span>Demo Project</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span className="text-muted-foreground">+ New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DatasetSelector() {
  const { datasetId } = useWorkspaceStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          <span className="text-muted-foreground text-xs">Dataset:</span>
          <span className="font-medium">{datasetId ? 'Sample Dataset' : 'Select Dataset'}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem>
          <span>Sample Dataset</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span>Titanic Dataset</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Upload className="w-4 h-4 mr-2" />
          <span>Upload New Dataset</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <User className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">User</p>
          <p className="text-xs text-muted-foreground">user@example.com</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
