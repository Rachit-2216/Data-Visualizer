'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Upload,
  Download,
  Search,
  Settings,
  User,
  LogOut,
  BarChart3,
  Code2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';
import { useWorkspaceStore } from '@/store/workspace-store';

const downloadBlob = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: Array<Record<string, unknown>>) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(',')),
  ];
  return lines.join('\n');
};

export function TopBar() {
  const router = useRouter();
  const [showSignOutToast, setShowSignOutToast] = useState(false);
  const { user } = useAuthStore();
  const { setProject, setDataset } = useWorkspaceStore();
  const { projects, currentProjectId, openCreateModal, selectProject } = useProjectStore();
  const { datasetsByProject, currentDatasetId, openUploadModal, selectDataset } = useDatasetStore();

  const datasets = useMemo(
    () => (currentProjectId ? datasetsByProject[currentProjectId] ?? [] : []),
    [currentProjectId, datasetsByProject]
  );

  const activeProjectName =
    projects.find((item) => item.id === currentProjectId)?.name ?? 'Select Project';
  const activeDatasetName =
    datasets.find((item) => item.id === currentDatasetId)?.name ?? 'Select Dataset';

  const handleProjectSelect = (id: string) => {
    selectProject(id);
    setProject(id);
    const nextDatasets = datasetsByProject[id] ?? [];
    const nextDatasetId = nextDatasets[0]?.id ?? null;
    selectDataset(nextDatasetId);
    setDataset(nextDatasetId, nextDatasetId ? `${nextDatasetId}-v1` : null);
  };

  return (
    <div className="h-10 bg-[#070b14] border-b border-white/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Link
          href={user ? '/workspace' : '/'}
          className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
        >
          <div className="w-7 h-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.15)]">
            <BarChart3 className="w-4 h-4 text-cyan-300" />
          </div>
          <span className="font-semibold text-[13px] text-white">DataCanvas</span>
        </Link>

        <ProjectSelector
          activeLabel={activeProjectName}
          projects={projects}
          currentProjectId={currentProjectId}
          onSelect={handleProjectSelect}
          onCreate={openCreateModal}
        />
        <DatasetSelector
          activeLabel={activeDatasetName}
          datasets={datasets}
          currentDatasetId={currentDatasetId}
          onSelect={(id) => {
            const selected = datasets.find((item) => item.id === id);
            selectDataset(id);
            setDataset(id, selected?.versionId ?? (id ? `${id}-v1` : null));
          }}
          onUpload={openUploadModal}
        />
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full max-w-sm justify-start text-white/60 h-7 border-white/10 bg-white/5"
          onClick={() => {
            // TODO: Open command palette
          }}
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Search or type a command...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-black/40 px-1.5 font-mono text-[10px] font-medium text-white/60">
            <span className="text-xs">Cmd</span>K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white/70 hover:text-white"
          onClick={openUploadModal}
        >
          <Upload className="w-4 h-4 text-cyan-300" />
          Upload
        </Button>

        <ExportMenu />

        <div className="w-px h-6 bg-white/10 mx-2" />

        <UserMenu onSignedOut={() => {
          setShowSignOutToast(true);
          window.setTimeout(() => setShowSignOutToast(false), 2500);
          router.push('/');
        }} />
      </div>

      <ProjectCreateModal />
      <DatasetUploadModal />

      {showSignOutToast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-white/10 bg-[#0b111c] px-3 py-2 text-xs text-white shadow-lg">
          Signed out successfully.
        </div>
      )}
    </div>
  );
}

function ProjectSelector({
  activeLabel,
  projects,
  currentProjectId,
  onSelect,
  onCreate,
}: {
  activeLabel: string;
  projects: Array<{ id: string; name: string }>;
  currentProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8 text-white/70">
          <span className="text-white/40 text-xs">Project:</span>
          <span className="font-medium text-white">{activeLabel}</span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            className={project.id === currentProjectId ? 'bg-white/5' : ''}
            onClick={() => onSelect(project.id)}
          >
            <span>{project.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate}>
          <span className="text-muted-foreground">+ New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DatasetSelector({
  activeLabel,
  datasets,
  currentDatasetId,
  onSelect,
  onUpload,
}: {
  activeLabel: string;
  datasets: Array<{ id: string; name: string; createdAt: string; rowCount: number }>;
  currentDatasetId: string | null;
  onSelect: (id: string) => void;
  onUpload: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-8 text-white/70">
          <span className="text-white/40 text-xs">Dataset:</span>
          <span className="font-medium text-white">{activeLabel}</span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {datasets.map((dataset) => (
          <DropdownMenuItem
            key={dataset.id}
            className={dataset.id === currentDatasetId ? 'bg-white/5' : ''}
            onClick={() => onSelect(dataset.id)}
          >
            <div className="flex flex-col">
              <span>{dataset.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(dataset.createdAt).toLocaleDateString()} · {formatNumber(dataset.rowCount)} rows
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onUpload}>
          <Upload className="w-4 h-4 mr-2" />
          <span>Upload New Dataset</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportMenu() {
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();
  const datasets = currentProjectId ? datasetsByProject[currentProjectId] ?? [] : [];
  const activeDataset = datasets.find((dataset) => dataset.id === currentDatasetId);

  const handleJsonExport = () => {
    if (!activeDataset?.profile) return;
    const jsonString = JSON.stringify(activeDataset.profile, null, 2);
    downloadBlob(jsonString, `${activeDataset.name}-profile.json`, 'application/json');
  };

  const handleCsvExport = () => {
    if (!activeDataset?.sampleRows?.length) return;
    const csv = toCsv(activeDataset.sampleRows);
    downloadBlob(csv, `${activeDataset.name}-sample.csv`, 'text/csv');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white">
          <Download className="w-4 h-4 text-amber-300" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={handleJsonExport}>
          <Code2 className="w-4 h-4 mr-2" />
          Export Profile as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCsvExport}>
          <FileText className="w-4 h-4 mr-2" />
          Export Data Sample as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ onSignedOut }: { onSignedOut: () => void }) {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { reset: resetProjects } = useProjectStore();
  const { reset: resetDatasets } = useDatasetStore();
  const { setProject, setDataset } = useWorkspaceStore();

  const handleSignOut = async () => {
    await signOut();
    resetProjects();
    resetDatasets();
    setProject(null);
    setDataset(null, null);
    onSignedOut();
  };

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70">
            <User className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push('/login')}>
            Sign in
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/signup')}>
            Create account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70">
          <User className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">User</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectCreateModal() {
  const [name, setName] = useState('');
  const { isCreateModalOpen, closeCreateModal, createProject } = useProjectStore();

  const handleCreate = async () => {
    const created = await createProject(name);
    if (created) {
      setName('');
    }
  };

  return (
    <Dialog
      open={isCreateModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCreateModal();
          setName('');
        }
      }}
    >
      <DialogContent className="bg-[#0b111c] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="projectName" className="text-sm text-white/70">
            Project name
          </label>
          <Input
            id="projectName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Untitled project"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeCreateModal}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DatasetUploadModal() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const { currentProjectId } = useProjectStore();
  const { isUploadModalOpen, closeUploadModal, uploadDataset, uploadProgress } = useDatasetStore();

  const handleFilePick = (picked: File | null) => {
    setError('');
    if (!picked) {
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const handleUpload = async () => {
    if (!currentProjectId) {
      setError('Select a project before uploading.');
      return;
    }
    if (!file) {
      setError('Choose a dataset file to upload.');
      return;
    }
    await uploadDataset(file, currentProjectId);
    setFile(null);
  };

  return (
    <Dialog
      open={isUploadModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeUploadModal();
          setFile(null);
          setError('');
        }
      }}
    >
      <DialogContent className="bg-[#0b111c] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Upload new dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const dropped = event.dataTransfer.files?.[0] ?? null;
              handleFilePick(dropped);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.parquet,.tsv"
              className="hidden"
              onChange={(event) => handleFilePick(event.target.files?.[0] ?? null)}
            />
            <p className="text-sm text-white/70">
              Drag & drop a file here, or click to browse.
            </p>
            <p className="text-xs text-white/40 mt-1">CSV, JSON, Parquet, TSV</p>
            {file && (
              <p className="mt-3 text-xs text-white/80">Selected: {file.name}</p>
            )}
          </div>
          {uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-white/50">Uploading... {uploadProgress}%</p>
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={closeUploadModal}>
            Cancel
          </Button>
          <Button onClick={handleUpload}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
