'use client';

import { InteractiveHistogram } from './interactive-histogram';

export function Histogram(props: {
  data: Array<Record<string, unknown>>;
  valueField: string;
  title?: string;
}) {
  return <InteractiveHistogram {...props} />;
}
