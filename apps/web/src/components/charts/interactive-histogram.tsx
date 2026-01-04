'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveHistogram({
  data,
  valueField,
  title,
}: {
  data: Array<Record<string, unknown>>;
  valueField: string;
  title?: string;
}) {
  const spec = {
    data: { values: data },
    mark: { type: 'bar' },
    encoding: {
      x: { field: valueField, type: 'quantitative', bin: true },
      y: { aggregate: 'count', type: 'quantitative' },
      color: { value: '#f97316' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
