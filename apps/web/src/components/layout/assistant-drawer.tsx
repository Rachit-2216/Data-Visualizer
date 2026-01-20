'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/store/layout-store';
import { AssistantPanel } from './assistant-panel';

export function AssistantDrawer() {
  const {
    assistantPanelOpen,
    assistantDrawerExpanded,
    assistantDrawerHeight,
    toggleAssistantPanel,
    toggleAssistantDrawer,
    setAssistantDrawerHeight,
  } = useLayoutStore();

  const drawerHeight = assistantDrawerExpanded ? assistantDrawerHeight : 64;

  const startDrawerDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = assistantDrawerHeight;
    const maxHeight = Math.min(window.innerHeight * 0.5, 520);

    const onMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const nextHeight = Math.min(maxHeight, Math.max(96, startHeight + delta));
      setAssistantDrawerHeight(nextHeight);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!assistantPanelOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-6 right-6 h-10 w-10 rounded-full border-white/10 bg-[#060a12] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        onClick={toggleAssistantPanel}
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className="absolute left-4 right-4 bottom-4 rounded-2xl border border-white/10 bg-[#060a12]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(2,6,23,0.6)] transition-all duration-300"
      style={{ height: drawerHeight, maxHeight: '50vh' }}
    >
      <div
        className="h-6 flex items-center justify-center cursor-pointer text-white/40"
        onClick={toggleAssistantDrawer}
        onMouseDown={startDrawerDrag}
      >
        <div className="h-1 w-12 rounded-full bg-white/20" />
      </div>
      <div className="h-[calc(100%-24px)]">
        <AssistantPanel collapsed={!assistantDrawerExpanded} />
      </div>
    </div>
  );
}
