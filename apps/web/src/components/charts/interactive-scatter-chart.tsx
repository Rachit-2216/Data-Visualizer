'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveScatterChart({
  data,
  xField,
  yField,
  colorField,
  title,
}: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  colorField?: string;
  title?: string;
}) {
  const spec = {
    data: { values: data },
    mark: { type: 'circle', size: 80, opacity: 0.85 },
    encoding: {
      x: { field: xField, type: 'quantitative' },
      y: { field: yField, type: 'quantitative' },
      color: colorField ? { field: colorField, type: 'nominal' } : { value: '#60a5fa' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
