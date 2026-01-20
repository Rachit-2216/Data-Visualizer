'use client';

import { InteractiveHeatmap } from './interactive-heatmap';

export function Heatmap(props: {
  data: Array<Record<string, unknown>>;
  xField: string;
  yField: string;
  valueField: string;
  title?: string;
}) {
  return <InteractiveHeatmap {...props} />;
}
