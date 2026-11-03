'use client';

import type { CableLengthUnit, LensFovResult } from '@cctv/calc-core';
import { useElementSize } from '@mantine/hooks';
import { formatNumber } from '../../../../../lib/format';
import { densityIn, formatLength } from '../../_lib/lens-fov-labels';
import { cameraViewLayout } from '../../_lib/visual-geometry';
import { ArrowMarker, Chip, useSvgId } from './svg-parts';
import classes from './Visuals.module.css';

/** Person silhouette in a 0.28 × 1 box with the feet at y = 1. */
const PERSON_BODY =
  'M0.05,0.155 Q0.14,0.13 0.23,0.155 L0.27,0.2 L0.265,0.5 L0.235,0.5 L0.225,0.26 L0.215,0.55 L0.2,1 L0.15,1 L0.14,0.6 L0.13,1 L0.08,1 L0.065,0.55 L0.055,0.26 L0.045,0.5 L0.015,0.5 L0.01,0.2 Z';

/** Width to draw at before the container has been measured. */
const FALLBACK_WIDTH = 640;

interface CameraViewProps {
  result: LensFovResult;
  unit: CableLengthUnit;
  focalLengthMm: number;
  showPixelGrid: boolean;
}

/** What the camera sees on the target plane at the distance, drawn to scale. */
export function CameraView({ result, unit, focalLengthMm, showPixelGrid }: CameraViewProps) {
  const { ref, width: measured } = useElementSize();
  const clipId = useSvgId('view-clip');
  const arrowId = useSvgId('view-arrow');
  const width = measured > 0 ? measured : FALLBACK_WIDTH;
  const view = cameraViewLayout(width, result, unit, showPixelGrid);
  const { height, person } = view;
  const narrow = width < 400;
  const centreX = width / 2;

  const coverageWidth = formatLength(result.horizontalCoverageM, unit);
  const coverageHeight = formatLength(result.verticalCoverageM, unit);
  const personPx = Math.round(result.personHeightPx);
  const personLabel = narrow
    ? `≈ ${personPx} px tall`
    : `6 ft person ≈ ${personPx} px${view.personFits ? '' : ' (taller than frame)'}`;
  const labelRight = centreX + person.width / 2 + 6 > width * 0.7;

  return (
    <div ref={ref} className={classes.drawing}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={classes.svg}
        role="img"
        aria-label={`Camera view at ${formatLength(result.distanceM, unit)}: ${coverageWidth} wide by ${coverageHeight} tall. A 6 ft person is about ${personPx} pixels tall.`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect width={width} height={height} rx={6} />
          </clipPath>
          <ArrowMarker id={arrowId} />
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect width={width} height={height} className={classes.sky} />
          {view.groundY < height && (
            <rect
              y={view.groundY}
              width={width}
              height={height - view.groundY}
              className={classes.ground}
            />
          )}
          {view.gridX.map((x) => (
            <line key={`x${x}`} x1={x} x2={x} y1={0} y2={height} className={classes.grid} />
          ))}
          {view.gridY.map((y) => (
            <line key={`y${y}`} x1={0} x2={width} y1={y} y2={y} className={classes.grid} />
          ))}
          {view.groundY < height && (
            <line
              x1={0}
              x2={width}
              y1={view.groundY}
              y2={view.groundY}
              className={classes.groundLine}
            />
          )}

          <g
            transform={`translate(${person.x} ${person.y}) scale(${person.height})`}
            className={classes.person}
          >
            <circle cx={0.14} cy={0.065} r={0.062} />
            <path d={PERSON_BODY} />
          </g>

          {showPixelGrid && (
            <g className={classes.pixelGrid}>
              {view.pixelX.map((x) => (
                <line key={`px${x}`} x1={x} x2={x} y1={0} y2={height} />
              ))}
              {view.pixelY.map((y) => (
                <line key={`py${y}`} x1={0} x2={width} y1={y} y2={y} />
              ))}
            </g>
          )}

          {view.unitSquare && (
            <g>
              <rect
                x={view.unitSquare.x}
                y={view.unitSquare.y}
                width={view.unitSquare.side}
                height={view.unitSquare.side}
                className={classes.unitSquare}
              />
              <Chip
                x={view.unitSquare.x + view.unitSquare.side}
                y={Math.max(view.unitSquare.y - 14, 60)}
                text={`1 ${unit} = ${formatNumber(densityIn(result.pixelsPerMetre, unit))} px`}
                anchor="end"
                fontSize={11}
              />
            </g>
          )}

          <Chip
            x={Math.min(centreX + person.width / 2 + 6, width - 8)}
            y={Math.min(Math.max(person.y + 12, 60), height - 40)}
            text={personLabel}
            anchor={labelRight ? 'end' : 'start'}
            fontSize={11}
            muted
          />
        </g>

        <line
          x1={6}
          x2={width - 6}
          y1={16}
          y2={16}
          markerStart={`url(#${arrowId})`}
          markerEnd={`url(#${arrowId})`}
          className={classes.dimension}
        />
        <Chip x={centreX} y={16} text={coverageWidth} />
        <line
          x1={width - 16}
          x2={width - 16}
          y1={6}
          y2={height - 6}
          markerStart={`url(#${arrowId})`}
          markerEnd={`url(#${arrowId})`}
          className={classes.dimension}
        />
        <Chip x={width - 6} y={height / 2} text={coverageHeight} anchor="end" />

        {!narrow && (
          <Chip
            x={8}
            y={height - 16}
            text={`${formatLength(result.distanceM, unit)} · ${formatNumber(focalLengthMm, 1)} mm · grid ${formatNumber(view.gridStep)} ${unit}`}
            anchor="start"
            fontSize={11}
            muted
          />
        )}
        {showPixelGrid && (
          <Chip
            x={narrow ? 8 : width - 26}
            y={height - 16}
            text={`cell = ${view.cellPixels} × ${view.cellPixels} px`}
            anchor={narrow ? 'start' : 'end'}
            fontSize={11}
            muted
          />
        )}

        <rect
          x={0.5}
          y={0.5}
          width={width - 1}
          height={height - 1}
          rx={6}
          className={classes.frame}
        />
      </svg>
    </div>
  );
}
