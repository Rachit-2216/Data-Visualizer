'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveHeatmap({
  data,
  xField,
  yField,
  valueField,
  title,
}: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  valueField: string;
  title?: string;
}) {
  const spec = {
    data: { values: data },
    mark: 'rect',
    encoding: {
      x: { field: xField, type: 'nominal' },
      y: { field: yField, type: 'nominal' },
      color: { field: valueField, type: 'quantitative', scale: { scheme: 'blues' } },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
