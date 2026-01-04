'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractivePieChart({
  data,
  valueField,
  categoryField,
  title,
}: {
  data: Array<Record<string, unknown>>;
  valueField: string;
  categoryField: string;
  title?: string;
}) {
  const spec = {
    data: { values: data },
    mark: { type: 'arc', innerRadius: 50 },
    encoding: {
      theta: { field: valueField, type: 'quantitative' },
      color: { field: categoryField, type: 'nominal' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
