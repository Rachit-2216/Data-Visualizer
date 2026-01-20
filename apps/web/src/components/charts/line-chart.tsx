'use client';

import { InteractiveLineChart } from './interactive-line-chart';

export function LineChart(props: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  title?: string;
}) {
  return <InteractiveLineChart {...props} />;
}
