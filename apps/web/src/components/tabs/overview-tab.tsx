'use client';

import {
  FileSpreadsheet,
  Rows3,
  Columns3,
  AlertTriangle,
  HardDrive,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock profile data
const mockProfile = {
  dataset: {
    name: 'Titanic Dataset',
    version: 1,
    status: 'ready',
    uploadedAt: '2024-01-15T10:30:00Z',
  },
  stats: {
    rowCount: 891,
    columnCount: 12,
    memoryMb: 0.15,
    duplicateRows: 0,
    missingCells: 866,
  },
  warnings: [
    { severity: 'high', message: 'Column "Age" has 19.9% missing values' },
    { severity: 'med', message: 'Column "Cabin" has 77.1% missing values' },
    { severity: 'low', message: 'High cardinality in "Name" column' },
  ],
  columnTypes: {
    numeric: 5,
    categorical: 5,
    text: 2,
    datetime: 0,
  },
};

export function OverviewTab() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{mockProfile.dataset.name}</h1>
          <p className="text-muted-foreground">
            Version {mockProfile.dataset.version} • Uploaded{' '}
            {new Date(mockProfile.dataset.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Ready
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Rows3}
          label="Rows"
          value={mockProfile.stats.rowCount.toLocaleString()}
        />
        <StatCard
          icon={Columns3}
          label="Columns"
          value={mockProfile.stats.columnCount.toString()}
        />
        <StatCard
          icon={HardDrive}
          label="Size"
          value={`${mockProfile.stats.memoryMb} MB`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Warnings"
          value={mockProfile.warnings.length.toString()}
          variant="warning"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Column Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Column Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(mockProfile.columnTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        type === 'numeric'
                          ? 'bg-blue-500'
                          : type === 'categorical'
                          ? 'bg-green-500'
                          : type === 'text'
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                      }`}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            {/* Simple bar chart */}
            <div className="mt-4 h-4 rounded-full overflow-hidden flex bg-muted">
              <div
                className="bg-blue-500"
                style={{
                  width: `${
                    (mockProfile.columnTypes.numeric / mockProfile.stats.columnCount) * 100
                  }%`,
                }}
              />
              <div
                className="bg-green-500"
                style={{
                  width: `${
                    (mockProfile.columnTypes.categorical / mockProfile.stats.columnCount) *
                    100
                  }%`,
                }}
              />
              <div
                className="bg-purple-500"
                style={{
                  width: `${
                    (mockProfile.columnTypes.text / mockProfile.stats.columnCount) * 100
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warnings & Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockProfile.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      warning.severity === 'high'
                        ? 'text-red-500'
                        : warning.severity === 'med'
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                    }`}
                  />
                  <p className="text-sm">{warning.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Generated Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This dataset contains <strong>{mockProfile.stats.rowCount}</strong> rows and{' '}
            <strong>{mockProfile.stats.columnCount}</strong> columns. The data includes{' '}
            {mockProfile.columnTypes.numeric} numeric features and{' '}
            {mockProfile.columnTypes.categorical} categorical features. There are some
            missing values, particularly in the "Age" column (19.9% missing) and "Cabin"
            column (77.1% missing). The "Survived" column appears to be a good target
            variable for binary classification. No duplicate rows were detected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              variant === 'warning' ? 'bg-yellow-500/10' : 'bg-primary/10'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                variant === 'warning' ? 'text-yellow-600' : 'text-primary'
              }`}
            />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
