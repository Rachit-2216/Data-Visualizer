'use client';

import {
  Rows3,
  Columns3,
  AlertTriangle,
  HardDrive,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/store/project-store';
import { useDatasetStore } from '@/store/dataset-store';

export function OverviewTab() {
  const { currentProjectId } = useProjectStore();
  const { datasetsByProject, currentDatasetId } = useDatasetStore();
  const dataset = currentProjectId
    ? (datasetsByProject[currentProjectId] ?? []).find((item) => item.id === currentDatasetId)
    : undefined;
  const profile =
    dataset?.profile ??
    ({
      dataset: {
        name: 'No dataset selected',
        version: 1,
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
      stats: {
        rowCount: 0,
        columnCount: 0,
        memoryMb: 0,
        duplicateRows: 0,
        missingCells: 0,
      },
      warnings: [],
      columnTypes: {
        numeric: 0,
        categorical: 0,
        text: 0,
        datetime: 0,
        boolean: 0,
      },
    });

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{profile.dataset.name}</h1>
          <p className="text-white/60">
            Version {profile.dataset.version} - Uploaded{' '}
            {new Date(profile.dataset.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm">
          <CheckCircle className="h-4 w-4" />
          Ready
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Rows3} label="Rows" value={profile.stats.rowCount.toLocaleString()} />
        <StatCard icon={Columns3} label="Columns" value={profile.stats.columnCount.toString()} />
        <StatCard icon={HardDrive} label="Size" value={`${profile.stats.memoryMb} MB`} />
        <StatCard
          icon={AlertTriangle}
          label="Warnings"
          value={profile.warnings.length.toString()}
          variant="warning"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Column Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(profile.columnTypes).map(([type, count]) => (
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
                    <span className="capitalize text-white/80">{type}</span>
                  </div>
                  <span className="font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-4 rounded-full overflow-hidden flex bg-white/10">
              <div
                className="bg-blue-500"
                style={{
                  width: `${
                    profile.stats.columnCount
                      ? (profile.columnTypes.numeric / profile.stats.columnCount) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-green-500"
                style={{
                  width: `${
                    profile.stats.columnCount
                      ? (profile.columnTypes.categorical / profile.stats.columnCount) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-purple-500"
                style={{
                  width: `${
                    profile.stats.columnCount
                      ? (profile.columnTypes.text / profile.stats.columnCount) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Warnings and Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.warnings.length === 0 ? (
              <p className="text-sm text-white/60">No warnings available.</p>
            ) : (
              <div className="space-y-3">
                {profile.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-white/5">
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        warning.severity === 'high'
                          ? 'text-red-500'
                          : warning.severity === 'med'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                    />
                    <p className="text-sm text-white/80">{warning.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Auto-Generated Summary</CardTitle>
        </CardHeader>
      <CardContent>
        <p className="text-sm text-white/70 leading-relaxed">
          This dataset contains <strong>{profile.stats.rowCount}</strong> rows and{' '}
          <strong>{profile.stats.columnCount}</strong> columns. The data includes{' '}
          {profile.columnTypes.numeric} numeric features and{' '}
          {profile.columnTypes.categorical} categorical features. There are{' '}
          {profile.stats.missingCells} missing cells detected across the dataset. Review
          the warnings panel for any schema-level concerns before building charts.
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
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              variant === 'warning' ? 'bg-yellow-500/10' : 'bg-cyan-400/10'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                variant === 'warning' ? 'text-yellow-300' : 'text-cyan-300'
              }`}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-white/60">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
