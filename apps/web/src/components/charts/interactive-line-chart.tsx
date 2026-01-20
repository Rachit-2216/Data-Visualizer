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
    layer: [
      {
        mark: { type: 'line', point: { filled: true, size: 64 } },
        encoding: {
          x: { field: xField, type: 'quantitative' },
          y: { field: yField, type: 'quantitative' },
          color: { value: '#38bdf8' },
          opacity: {
            condition: [
              { param: 'hover', value: 1 },
              { param: 'select', value: 1 },
            ],
            value: 0.35,
          },
          tooltip: [
            { field: xField, type: 'quantitative' },
            { field: yField, type: 'quantitative' },
          ],
        },
      },
      {
        transform: [{ filter: { param: 'hover' } }],
        mark: { type: 'rule', color: '#38bdf8', strokeDash: [4, 4] },
        encoding: {
          x: { field: xField, type: 'quantitative' },
        },
      },
    ],
  };

  return <InteractiveChartWrapper spec={spec} title={title} />;
}
