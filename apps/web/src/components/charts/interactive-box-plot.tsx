'use client';

import { InteractiveChartWrapper } from './interactive-chart-wrapper';

export function InteractiveBoxPlot({
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
    mark: { type: 'boxplot', extent: 'min-max' },
    encoding: {
      x: { field: xField, type: 'nominal' },
      y: { field: yField, type: 'quantitative' },
      color: { value: '#fb7185' },
    },
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
