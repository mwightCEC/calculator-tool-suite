'use client';

import { DORI_LEVELS, type CableLengthUnit, type LensFovResult } from '@cctv/calc-core';
import { useElementSize } from '@mantine/hooks';
import { formatNumber } from '../../../../../lib/format';
import { DORI_LEVEL_LABELS, formatDegrees, formatLength } from '../../_lib/lens-fov-labels';
import { coverageLayout } from '../../_lib/visual-geometry';
import { ArrowMarker, Chip, useSvgId } from './svg-parts';
import classes from './Visuals.module.css';

/** Width to draw at before the container has been measured. */
const FALLBACK_WIDTH = 640;
const SIDE = 16;

interface CoverageDiagramProps {
  result: LensFovResult;
  unit: CableLengthUnit;
  /** "Farthest" when the distance was solved for a target. */
  distancePrefix?: string;
}

/** Top-down plan of the field of view with the DORI bands, to scale. */
export function CoverageDiagram({ result, unit, distancePrefix }: CoverageDiagramProps) {
  const { ref, width: measured } = useElementSize();
  const arrowId = useSvgId('plan-arrow');
  const width = measured > 0 ? measured : FALLBACK_WIDTH;
  const plan = coverageLayout(width, result, unit);
  const { camera, height } = plan;

  const coverage = formatLength(result.horizontalCoverageM, unit);
  const angle = formatDegrees(result.horizontalFovDeg);
  const distance = formatLength(result.distanceM, unit);
  const distanceText = distancePrefix ? `${distancePrefix} ${distance}` : distance;

  return (
    <div ref={ref} className={classes.drawing}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={classes.svg}
        role="img"
        aria-label={`Top-down coverage: ${angle} horizontal field of view, ${coverage} wide at ${distance}.`}
      >
        <defs>
          <ArrowMarker id={arrowId} />
        </defs>
        <rect width={width} height={height} rx={6} className={classes.plan} />

        {plan.bands.map((band) => (
          <polygon
            key={band.level}
            points={band.points}
            className={classes.band}
            data-level={band.level}
          />
        ))}

        {plan.ticks.map((tick) => (
          <g key={tick.value}>
            <line x1={SIDE} x2={width - SIDE} y1={tick.y} y2={tick.y} className={classes.tick} />
            <text x={width - 6} y={tick.y - 4} textAnchor="end" className={classes.tickText}>
              {formatNumber(tick.value, 2)} {unit}
            </text>
          </g>
        ))}

        {/* The cone carries on past the target at the same angle. */}
        {[-1, 1].map((sign) => (
          <line
            key={sign}
            x1={camera.x + sign * plan.planeHalfWidth}
            y1={plan.planeY}
            x2={camera.x + sign * plan.farHalfWidth}
            y2={plan.farY}
            className={classes.coneBeyond}
          />
        ))}
        <polygon
          points={`${camera.x},${camera.y} ${camera.x - plan.planeHalfWidth},${plan.planeY} ${camera.x + plan.planeHalfWidth},${plan.planeY}`}
          className={classes.cone}
        />
        <line
          x1={camera.x}
          y1={camera.y}
          x2={camera.x}
          y2={plan.planeY}
          className={classes.centreLine}
        />
        <path
          d={`M${plan.arc.start.x},${plan.arc.start.y} A${plan.arc.radius},${plan.arc.radius} 0 0 1 ${plan.arc.end.x},${plan.arc.end.y}`}
          className={classes.arc}
        />

        <line
          x1={camera.x - plan.planeHalfWidth}
          x2={camera.x + plan.planeHalfWidth}
          y1={plan.planeY}
          y2={plan.planeY}
          markerStart={`url(#${arrowId})`}
          markerEnd={`url(#${arrowId})`}
          className={classes.targetLine}
        />
        <circle cx={camera.x} cy={plan.planeY} r={4.5} className={classes.targetDot} />
        <Chip x={camera.x} y={Math.max(plan.planeY - 18, 14)} text={`${coverage} wide`} />
        <Chip
          x={camera.x - 8}
          y={(camera.y + plan.planeY) / 2}
          text={distanceText}
          anchor="end"
          fontSize={11}
        />
        <Chip
          x={Math.min(plan.arc.end.x + 8, width - 60)}
          y={plan.arc.end.y - 6}
          text={angle}
          anchor="start"
          fontSize={11}
        />

        <rect
          x={camera.x - 10}
          y={camera.y + 3}
          width={20}
          height={12}
          rx={2}
          className={classes.camera}
        />
        <path
          d={`M${camera.x - 5},${camera.y + 3} L${camera.x - 7},${camera.y - 2} L${camera.x + 7},${camera.y - 2} L${camera.x + 5},${camera.y + 3} Z`}
          className={classes.camera}
        />
        <text x={camera.x} y={camera.y + 30} textAnchor="middle" className={classes.cameraLabel}>
          Camera
        </text>
        {width >= 400 && (
          <text x={SIDE} y={height - 12} className={classes.caption}>
            Top-down view, to scale
          </text>
        )}
      </svg>
    </div>
  );
}

/** Key to the DORI bands, nearest the camera first. */
export function DoriLegend() {
  return (
    <ul className={classes.legend} aria-label="DORI bands">
      {[...DORI_LEVELS].reverse().map((level) => (
        <li key={level} className={classes.legendItem}>
          <span className={classes.swatch} data-level={level} aria-hidden="true" />
          {DORI_LEVEL_LABELS[level]}
        </li>
      ))}
    </ul>
  );
}
