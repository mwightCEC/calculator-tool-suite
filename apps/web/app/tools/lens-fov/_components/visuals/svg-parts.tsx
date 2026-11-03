import { useId } from 'react';
import classes from './Visuals.module.css';

/** An SVG id unique to this instance and safe inside url(#…). */
export function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** Arrowhead for dimension lines; use with markerStart and markerEnd. */
export function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="10"
      markerHeight="10"
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 z" className={classes.arrowHead} />
    </marker>
  );
}

interface ChipProps {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  fontSize?: number;
  muted?: boolean;
}

/** A label on an opaque backing so it stays legible over lines and shapes; placed by its vertical centre. */
export function Chip({ x, y, text, anchor = 'middle', fontSize = 12, muted = false }: ChipProps) {
  // Approximate text width; SVG can't measure before it draws.
  const width = text.length * fontSize * 0.58 + 12;
  const height = fontSize + 8;
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'start' ? x : x - width;
  return (
    <g>
      <rect
        x={left}
        y={y - height / 2}
        width={width}
        height={height}
        rx={4}
        className={classes.chip}
      />
      <text
        x={left + width / 2}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        className={classes.chipText}
        data-muted={muted || undefined}
      >
        {text}
      </text>
    </g>
  );
}
