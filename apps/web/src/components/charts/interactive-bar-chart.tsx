'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveBarChart({
  data,
  xField,
  yField,
  title,
}: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  title?: string;
}) {
  const spec = {
    data: { values: data },
    mark: { type: 'bar', cornerRadiusEnd: 4 },
    encoding: {
      x: { field: xField, type: 'nominal', axis: { labelColor: '#cbd5f5' } },
      y: { field: yField, type: 'quantitative' },
      color: { value: '#60a5fa' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
