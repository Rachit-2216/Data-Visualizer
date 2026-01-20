'use client';

import { ChartWrapper } from './chart-wrapper';

type InteractiveChartWrapperProps = {
  spec: Record<string, unknown>;
  title?: string;
};

export function InteractiveChartWrapper(props: InteractiveChartWrapperProps) {
  return <ChartWrapper {...props} />;
}
