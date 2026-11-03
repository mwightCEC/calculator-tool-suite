import {
  DORI_LEVELS,
  METRES_PER_FOOT,
  REFERENCE_PERSON_M,
  type CableLengthUnit,
  type DoriLevel,
  type LensFovResult,
} from '@cctv/calc-core';
import { lengthIn } from './lens-fov-labels';

/*
 * Layout for the camera view and coverage diagram, in SVG pixels. Every shape is
 * placed in real-world units, so the drawings stay to scale; nothing is scaled
 * from the pixel density directly.
 */

/** Readable 1-2-5 steps for grid spacing and scale ticks. */
const NICE_STEPS = [
  0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
  10_000,
];

/** Smallest nice step that splits `span` into at most `maxDivisions` parts. */
export function niceStep(span: number, maxDivisions: number): number {
  return NICE_STEPS.find((step) => span / step <= maxDivisions) ?? 10_000;
}

const metresPer = (unit: CableLengthUnit) => (unit === 'm' ? 1 : METRES_PER_FOOT);

/* Camera view */

/** The person silhouette's width as a share of its height. */
export const PERSON_WIDTH_RATIO = 0.28;
/** Smallest pixel-grid cell drawn, in SVG pixels, so the grid never turns solid. */
const MIN_PIXEL_CELL = 8;

export interface CameraViewLayout {
  width: number;
  height: number;
  personFits: boolean;
  groundY: number;
  person: { x: number; y: number; width: number; height: number };
  /** Reference grid lines on the target plane, and their spacing in the length unit. */
  gridX: number[];
  gridY: number[];
  gridStep: number;
  /** Pixel grid lines (empty when hidden); each cell is `cellPixels` × `cellPixels` image pixels. */
  pixelX: number[];
  pixelY: number[];
  cellPixels: number;
  /** A 1 ft or 1 m square beside the person, when the pixel grid shows and it is a readable size. */
  unitSquare: { x: number; y: number; side: number } | null;
}

/**
 * What the camera sees on the target plane: the frame's width is the horizontal
 * coverage. Height and tilt aren't modelled, so the person's vertical place is
 * illustrative: standing near the bottom when they fit, head near the top when not.
 */
export function cameraViewLayout(
  width: number,
  result: LensFovResult,
  unit: CableLengthUnit,
  showPixelGrid: boolean
): CameraViewLayout {
  const height = width / result.imageAspect;
  const sceneHeightM = result.verticalCoverageM;
  const pxPerM = width / result.horizontalCoverageM;
  const personM = REFERENCE_PERSON_M;
  const personFits = personM <= sceneHeightM * 0.85;
  const bottomM = personFits ? -0.06 * sceneHeightM : personM + 0.06 * sceneHeightM - sceneHeightM;
  const yOf = (metres: number) => height - (metres - bottomM) * pxPerM;
  const centreX = width / 2;

  const personHeight = personM * pxPerM;
  const personWidth = personHeight * PERSON_WIDTH_RATIO;
  const person = {
    x: centreX - personWidth / 2,
    y: yOf(personM),
    width: personWidth,
    height: personHeight,
  };

  const gridStep = niceStep(lengthIn(result.horizontalCoverageM, unit), 8);
  const gridPx = gridStep * metresPer(unit) * pxPerM;
  const gridX: number[] = [];
  for (let x = centreX % gridPx; x <= width; x += gridPx) {
    gridX.push(x);
  }
  const gridY: number[] = [];
  for (let y = yOf(0); y >= 0; y -= gridPx) {
    if (y <= height) {
      gridY.push(y);
    }
  }

  const screenPxPerImagePx = width / result.imageWidthPx;
  let cellPixels = 1;
  while (cellPixels * screenPxPerImagePx < MIN_PIXEL_CELL) {
    cellPixels *= 2;
  }
  const cell = cellPixels * screenPxPerImagePx;
  const linesAcross = (span: number) =>
    showPixelGrid ? Array.from({ length: Math.floor(span / cell) }, (_, i) => (i + 1) * cell) : [];

  const side = metresPer(unit) * pxPerM;
  const unitSquare =
    showPixelGrid && side >= 6 && side <= width * 0.3
      ? {
          x: person.x - 10 - side,
          y: personFits ? yOf(0) - side : height / 2 - side / 2,
          side,
        }
      : null;

  return {
    width,
    height,
    personFits,
    groundY: yOf(0),
    person,
    gridX,
    gridY,
    gridStep,
    pixelX: linesAcross(width),
    pixelY: linesAcross(height),
    cellPixels,
    unitSquare,
  };
}

/* Coverage diagram */

/**
 * Depths the diagram snaps to, in the length unit, so small distance changes move
 * the target line instead of rescaling the whole drawing.
 */
const RANGE_STEPS = [
  5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500,
  2000, 3000, 5000, 7500, 10_000,
];
const MARGIN = { top: 44, bottom: 42, side: 16 };

export interface DoriBand {
  level: DoriLevel;
  /** Trapezoid inside the cone, from the band's near edge to its far edge (clipped to the range). */
  points: string;
}

export interface CoverageLayout {
  width: number;
  height: number;
  camera: { x: number; y: number };
  /** The target line at the distance: its y and half its width. */
  planeY: number;
  planeHalfWidth: number;
  /** The cone's edges at the far end of the drawing. */
  farY: number;
  farHalfWidth: number;
  /** Distance ticks in the length unit, and the y of each. */
  ticks: { value: number; y: number }[];
  /** The angle arc near the camera. */
  arc: { radius: number; start: { x: number; y: number }; end: { x: number; y: number } };
  /** Where each DORI level is met, nearest (Identification) first; bands past the range are left out. */
  bands: DoriBand[];
}

/**
 * Top-down plan, to scale in both directions: the cone's half-angle is half the
 * horizontal field of view and the target line sits at the distance.
 */
export function coverageLayout(
  width: number,
  result: LensFovResult,
  unit: CableLengthUnit
): CoverageLayout {
  const maxHeight = Math.round(Math.min(Math.max(width * 0.6, 260), 380));
  const distance = lengthIn(result.distanceM, unit);
  const range = RANGE_STEPS.find((step) => step >= distance * 1.15) ?? distance * 1.15;
  const halfAngle = (result.horizontalFovDeg * Math.PI) / 360;
  const tanHalf = Math.tan(halfAngle);
  const scale = Math.min(
    (maxHeight - MARGIN.top - MARGIN.bottom) / range,
    (width / 2 - MARGIN.side) / (range * tanHalf)
  );
  // A very wide lens fills the width first; the height then shrinks to fit the drawing.
  const height = Math.max(200, Math.round(MARGIN.top + MARGIN.bottom + range * scale));
  const camera = { x: width / 2, y: height - MARGIN.bottom };
  const yAt = (depth: number) => camera.y - depth * scale;
  const halfWidthAt = (depth: number) => depth * tanHalf * scale;
  const planeY = yAt(distance);

  const tickStep = niceStep(range, 5);
  const ticks: { value: number; y: number }[] = [];
  for (let value = tickStep; value <= range + 1e-9 && ticks.length < 20; value += tickStep) {
    ticks.push({ value, y: yAt(value) });
  }

  const radius = Math.min(46, (camera.y - planeY) * 0.4);
  const arcPoint = (sign: number) => ({
    x: camera.x + sign * radius * Math.sin(halfAngle),
    y: camera.y - radius * Math.cos(halfAngle),
  });

  const reach = new Map(
    result.doriDistances.map((row) => [row.level, lengthIn(row.distanceM, unit)])
  );
  const bands: DoriBand[] = [];
  let near = 0;
  for (const level of [...DORI_LEVELS].reverse()) {
    const far = Math.min(reach.get(level) ?? 0, range);
    if (far > near) {
      const corner = (depth: number, sign: number) =>
        `${camera.x + sign * halfWidthAt(depth)},${yAt(depth)}`;
      bands.push({
        level,
        points: [corner(near, -1), corner(near, 1), corner(far, 1), corner(far, -1)].join(' '),
      });
    }
    near = Math.max(near, far);
  }

  return {
    width,
    height,
    camera,
    planeY,
    planeHalfWidth: halfWidthAt(distance),
    farY: yAt(range),
    farHalfWidth: halfWidthAt(range),
    ticks,
    arc: { radius, start: arcPoint(-1), end: arcPoint(1) },
    bands,
  };
}
