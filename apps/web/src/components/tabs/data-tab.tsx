'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data for the table
const mockColumns = [
  'PassengerId',
  'Survived',
  'Pclass',
  'Name',
  'Sex',
  'Age',
  'SibSp',
  'Parch',
  'Ticket',
  'Fare',
  'Cabin',
  'Embarked',
];

const mockData = Array.from({ length: 50 }, (_, i) => ({
  PassengerId: i + 1,
  Survived: Math.random() > 0.5 ? 1 : 0,
  Pclass: Math.floor(Math.random() * 3) + 1,
  Name: `Passenger ${i + 1}`,
  Sex: Math.random() > 0.5 ? 'male' : 'female',
  Age: Math.random() > 0.2 ? Math.floor(Math.random() * 60) + 10 : null,
  SibSp: Math.floor(Math.random() * 4),
  Parch: Math.floor(Math.random() * 3),
  Ticket: `TICKET${Math.floor(Math.random() * 10000)}`,
  Fare: (Math.random() * 200 + 10).toFixed(2),
  Cabin: Math.random() > 0.7 ? `C${Math.floor(Math.random() * 100)}` : null,
  Embarked: ['S', 'C', 'Q'][Math.floor(Math.random() * 3)],
}));

export function DataTab() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 20;
  const totalRows = 891;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64 h-8"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 border-b">
              <tr>
                {mockColumns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockData.slice(0, rowsPerPage).map((row, i) => (
                <tr
                  key={i}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  {mockColumns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2 whitespace-nowrap"
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
      <div className="h-10 border-t flex items-center justify-between px-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * rowsPerPage + 1}-
          {Math.min(page * rowsPerPage, totalRows)} of {totalRows.toLocaleString()} rows
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
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
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-mono">{value}</span>;
  }
  return <span className="truncate max-w-[200px] inline-block">{String(value)}</span>;
}
