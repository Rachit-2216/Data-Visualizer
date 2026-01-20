'use client';

import { InteractiveScatterChart } from './interactive-scatter-chart';

export function ScatterChart(props: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  colorField?: string;
  title?: string;
}) {
  return <InteractiveScatterChart {...props} />;
}
