'use client';

import { InteractivePieChart } from './interactive-pie-chart';

export function PieChart(props: {
  data: Array<Record<string, unknown>>;
  valueField: string;
  categoryField: string;
  title?: string;
}) {
  return <InteractivePieChart {...props} />;
}
