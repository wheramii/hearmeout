'use client';

import { useRef, type PointerEvent } from 'react';
import { accentMix } from '@/lib/accentGradient';

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function valueFromEvent(e: PointerEvent) {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(frac * 5 * 10) / 10;
  }

  return (
    <div
      className="star-rating interactive"
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        onChange(valueFromEvent(e));
      }}
      onPointerMove={(e) => { if (dragging.current) onChange(valueFromEvent(e)); }}
      onPointerUp={() => { dragging.current = false; }}
    >
      <div className="layer base">★★★★★</div>
      <div className="layer fill" style={{ width: `${(value / 5) * 100}%`, color: accentMix(value / 5) }}>★★★★★</div>
    </div>
  );
}
