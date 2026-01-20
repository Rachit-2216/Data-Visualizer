'use client';

import { InteractiveBarChart } from './interactive-bar-chart';

export function BarChart(props: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  title?: string;
}) {
  return <InteractiveBarChart {...props} />;
}
