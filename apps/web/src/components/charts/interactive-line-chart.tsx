'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveLineChart({
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
    mark: { type: 'line', point: true },
    encoding: {
      x: { field: xField, type: 'quantitative' },
      y: { field: yField, type: 'quantitative' },
      color: { value: '#38bdf8' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
