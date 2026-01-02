'use client';

import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  LineChart,
  ScatterChart,
  Grid3X3,
  AlertTriangle,
  Save,
  Maximize2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'summary', label: 'Summary', count: 3 },
  { id: 'missingness', label: 'Missingness', count: 3 },
  { id: 'distributions', label: 'Distributions', count: 10 },
  { id: 'correlations', label: 'Correlations', count: 3 },
  { id: 'outliers', label: 'Outliers', count: 5 },
  { id: 'categoricals', label: 'Categoricals', count: 4 },
  { id: 'target', label: 'Target', count: 4 },
];

// Mock charts data
const mockCharts = [
  { id: 'c1', title: 'Column Types Distribution', section: 'summary', type: 'pie' },
  { id: 'c2', title: 'Missing Values by Column', section: 'summary', type: 'bar' },
  { id: 'c3', title: 'Unique Values Ranking', section: 'summary', type: 'bar' },
  { id: 'c4', title: 'Missing Values Heatmap', section: 'missingness', type: 'heatmap' },
  { id: 'c5', title: 'Row-wise Missing Distribution', section: 'missingness', type: 'histogram' },
  { id: 'c6', title: 'Missing Percentage by Column', section: 'missingness', type: 'bar' },
  { id: 'c7', title: 'Age Distribution', section: 'distributions', type: 'histogram' },
  { id: 'c8', title: 'Fare Distribution', section: 'distributions', type: 'histogram' },
  { id: 'c9', title: 'SibSp Distribution', section: 'distributions', type: 'histogram' },
  { id: 'c10', title: 'Parch Distribution', section: 'distributions', type: 'histogram' },
  { id: 'c11', title: 'Correlation Matrix', section: 'correlations', type: 'heatmap' },
  { id: 'c12', title: 'Age vs Fare Scatter', section: 'correlations', type: 'scatter' },
  { id: 'c13', title: 'Top Correlated Pairs', section: 'correlations', type: 'bar' },
  { id: 'c14', title: 'Age Box Plot', section: 'outliers', type: 'box' },
  { id: 'c15', title: 'Fare Box Plot', section: 'outliers', type: 'box' },
  { id: 'c16', title: 'Outlier Counts', section: 'outliers', type: 'bar' },
  { id: 'c17', title: 'Sex Distribution', section: 'categoricals', type: 'bar' },
  { id: 'c18', title: 'Pclass Distribution', section: 'categoricals', type: 'bar' },
  { id: 'c19', title: 'Embarked Distribution', section: 'categoricals', type: 'bar' },
  { id: 'c20', title: 'Target Distribution', section: 'target', type: 'pie' },
  { id: 'c21', title: 'Age by Survived', section: 'target', type: 'box' },
  { id: 'c22', title: 'Pclass vs Survived', section: 'target', type: 'bar' },
  { id: 'c23', title: 'Sex vs Survived', section: 'target', type: 'bar' },
];

function getChartIcon(type: string) {
  switch (type) {
    case 'bar':
      return BarChart3;
    case 'pie':
      return PieChart;
    case 'line':
      return LineChart;
    case 'scatter':
      return ScatterChart;
    case 'heatmap':
      return Grid3X3;
    case 'histogram':
      return BarChart3;
    case 'box':
      return BarChart3;
    default:
      return BarChart3;
  }
}

export function VisualsTab() {
  const [activeSection, setActiveSection] = useState('summary');
  const filteredCharts = mockCharts.filter((c) => c.section === activeSection);

  return (
    <div className="h-full flex">
      {/* Section nav */}
      <div className="w-48 border-r bg-muted/30">
        <div className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            EDA Pack
          </p>
        </div>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="px-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.label}</span>
                <span className="text-xs text-muted-foreground">{section.count}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Charts grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold capitalize">{activeSection}</h2>
              <p className="text-sm text-muted-foreground">
                {filteredCharts.length} visualizations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ChartCard({
  chart,
}: {
  chart: { id: string; title: string; section: string; type: string };
}) {
  const Icon = getChartIcon(chart.type);

  return (
    <div className="rounded-xl border bg-card overflow-hidden group">
      {/* Chart area */}
      <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative">
        <div className="text-center text-muted-foreground">
          <Icon className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{chart.type} chart</p>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" className="gap-1">
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t flex items-center justify-between">
        <p className="text-sm font-medium truncate">{chart.title}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
