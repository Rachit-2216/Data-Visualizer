'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';

export function DataTab() {
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();
  const dataset = currentProjectId
    ? (datasetsByProject[currentProjectId] ?? []).find((item) => item.id === currentDatasetId)
    : undefined;
  const columns = dataset?.columns.map((col) => col.name) ?? [];
  const rows = dataset?.sampleRows ?? [];
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [onlySurvived, setOnlySurvived] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const rowsPerPage = 20;
  const filteredRows = useMemo(() => {
    let workingRows = rows;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      workingRows = workingRows.filter((row) =>
        columns.some((col) => String(row[col as keyof typeof row]).toLowerCase().includes(q))
      );
    }
    if (onlySurvived) {
      workingRows = workingRows.filter((row) => row.Survived === 1);
    }
    if (missingOnly) {
      workingRows = workingRows.filter((row) =>
        Object.values(row).some((value) => value === null || value === undefined)
      );
    }
    return workingRows;
  }, [columns, rows, searchTerm, onlySurvived, missingOnly]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pagedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, onlySurvived, missingOnly]);

  if (!dataset) {
    return (
      <div className="h-full flex items-center justify-center text-white/60 bg-[#0a0f1a]">
        <p>Select a dataset to view data.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0f1a]">
      {/* Toolbar */}
      <div className="border-b border-white/10 px-4 py-3 bg-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64 h-8 bg-black/30 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-white/10"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Profile
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 border-white/10">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
            <button
              className={`rounded-full border px-3 py-1 ${
                onlySurvived ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100' : 'border-white/10'
              }`}
              onClick={() => setOnlySurvived((prev) => !prev)}
            >
              Survived only
            </button>
            <button
              className={`rounded-full border px-3 py-1 ${
                missingOnly ? 'border-amber-300/60 bg-amber-300/10 text-amber-100' : 'border-white/10'
              }`}
              onClick={() => setMissingOnly((prev) => !prev)}
            >
              Missing values
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0b1220] border-b border-white/10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-medium text-white/60 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2 whitespace-nowrap text-white/80"
                    >
                      <CellValue value={row[col as keyof typeof row]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Pagination */}
      <div className="h-10 border-t border-white/10 flex items-center justify-between px-4 bg-white/5">
        <p className="text-sm text-white/50">
          Showing {(page - 1) * rowsPerPage + 1}-
          {Math.min(page * rowsPerPage, filteredRows.length)} of{' '}
          {filteredRows.length.toLocaleString()} rows
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-white/60">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-white/40 italic">null</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-white/80">{value}</span>;
  }
  return <span className="truncate max-w-[200px] inline-block">{String(value)}</span>;
}
