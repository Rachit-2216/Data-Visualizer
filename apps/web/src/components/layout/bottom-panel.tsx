'use client';

import { Play, AlertCircle, Terminal, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayoutStore } from '@/store/layout-store';
import { cn } from '@/lib/utils';

const bottomTabs = [
  { id: 'jobs', label: 'Jobs', icon: Play },
  { id: 'problems', label: 'Problems', icon: AlertCircle },
  { id: 'output', label: 'Output', icon: FileText },
  { id: 'logs', label: 'Logs', icon: Terminal },
] as const;

export function BottomPanel() {
  const { activeBottomTab, setActiveBottomTab, toggleBottomPanel } = useLayoutStore();

  return (
    <div className="h-full flex flex-col bg-background border-t">
      {/* Tab header */}
      <div className="h-8 flex items-center justify-between px-2 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          {bottomTabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-xs rounded-sm',
                'hover:bg-accent transition-colors',
                activeBottomTab === tab.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground'
              )}
              onClick={() => setActiveBottomTab(tab.id)}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === 'problems' && (
                <span className="bg-yellow-500/20 text-yellow-600 px-1 rounded text-[10px]">
                  3
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleBottomPanel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeBottomTab === 'jobs' && <JobsContent />}
        {activeBottomTab === 'problems' && <ProblemsContent />}
        {activeBottomTab === 'output' && <OutputContent />}
        {activeBottomTab === 'logs' && <LogsContent />}
      </ScrollArea>
    </div>
  );
}

function JobsContent() {
  const mockJobs = [
    {
      id: '1',
      type: 'profile',
      dataset: 'Titanic Dataset',
      status: 'done',
      progress: 100,
    },
    {
      id: '2',
      type: 'profile',
      dataset: 'Iris Dataset',
      status: 'running',
      progress: 65,
    },
  ];

  return (
    <div className="p-2 space-y-2">
      {mockJobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center gap-3 p-2 rounded-md bg-muted/30 text-sm"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              job.status === 'done' && 'bg-green-500',
              job.status === 'running' && 'bg-blue-500 animate-pulse',
              job.status === 'failed' && 'bg-red-500'
            )}
          />
          <div className="flex-1">
            <p className="font-medium">{job.dataset}</p>
            <p className="text-xs text-muted-foreground">
              {job.type} - {job.status === 'running' ? `${job.progress}%` : job.status}
            </p>
          </div>
          {job.status === 'running' && (
            <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProblemsContent() {
  const mockProblems = [
    {
      id: '1',
      severity: 'high',
      message: 'Column "Age" has 19.9% missing values',
      column: 'Age',
    },
    {
      id: '2',
      severity: 'med',
      message: 'Potential target leakage detected in "Cabin"',
      column: 'Cabin',
    },
    {
      id: '3',
      severity: 'low',
      message: 'High cardinality in "Name" column (891 unique values)',
      column: 'Name',
    },
  ];

  return (
    <div className="p-2 space-y-1">
      {mockProblems.map((problem) => (
        <div
          key={problem.id}
          className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/30 text-sm cursor-pointer"
        >
          <AlertCircle
            className={cn(
              'h-4 w-4 mt-0.5 shrink-0',
              problem.severity === 'high' && 'text-red-500',
              problem.severity === 'med' && 'text-yellow-500',
              problem.severity === 'low' && 'text-blue-500'
            )}
          />
          <div>
            <p>{problem.message}</p>
            <p className="text-xs text-muted-foreground">Column: {problem.column}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OutputContent() {
  return (
    <div className="p-2 font-mono text-xs text-muted-foreground">
      <p>[INFO] DataCanvas v1.0.0</p>
      <p>[INFO] Connected to workspace</p>
      <p>[INFO] Ready for dataset upload</p>
    </div>
  );
}

function LogsContent() {
  return (
    <div className="p-2 font-mono text-xs text-muted-foreground">
      <p>2024-01-15 10:30:15 - Profiler started for Titanic Dataset</p>
      <p>2024-01-15 10:30:16 - Loading file: titanic.csv</p>
      <p>2024-01-15 10:30:17 - Parsed 891 rows, 12 columns</p>
      <p>2024-01-15 10:30:18 - Computing statistics...</p>
      <p>2024-01-15 10:30:20 - Generating visualizations...</p>
      <p>2024-01-15 10:30:25 - Profile complete</p>
    </div>
  );
}
