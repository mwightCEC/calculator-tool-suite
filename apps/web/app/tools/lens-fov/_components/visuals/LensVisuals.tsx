'use client';

import { useState } from 'react';
import type { LensFovResult } from '@cctv/calc-core';
import { Switch } from '@mantine/core';
import { formatLength } from '../../_lib/lens-fov-labels';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { CameraView } from './CameraView';
import { ClaritySample } from './ClaritySample';
import { CoverageDiagram, DensityLevelLegend } from './CoverageDiagram';
import { VisualCard } from './VisualCard';
import classes from './Visuals.module.css';

interface LensVisualsProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
}

/** The camera view, top-down coverage and clarity sample, each in its own collapsible card. */
export function LensVisuals({ state, result }: LensVisualsProps) {
  const [showPixelGrid, setShowPixelGrid] = useState(false);
  const unit = state.lengthUnit;
  const distance = formatLength(result.distanceM, unit);

  return (
    <>
      <VisualCard
        title="Camera view"
        description={`The target plane at ${distance}, drawn to scale at the camera's aspect ratio. An illustration for scale, not a simulated image.`}
        action={
          <Switch
            size="sm"
            checked={showPixelGrid}
            onChange={(event) => setShowPixelGrid(event.currentTarget.checked)}
            label="Show pixel grid"
            className={classes.titleSwitch}
          />
        }
      >
        <CameraView
          result={result}
          unit={unit}
          focalLengthMm={state.focalLengthMm}
          showPixelGrid={showPixelGrid}
        />
      </VisualCard>

      <VisualCard title="Coverage">
        <CoverageDiagram
          result={result}
          unit={unit}
          distancePrefix={state.solveFor === 'distance' ? 'Farthest' : undefined}
        />
        <DensityLevelLegend />
      </VisualCard>

      <VisualCard
        title="Clarity sample"
        description="A drawn test scene at the pixels it would get at a distance. Move the slider to see detail drop away."
      >
        {/* Starts again at the calculator's distance whenever the inputs change it. */}
        <ClaritySample key={result.distanceM} result={result} unit={unit} />
      </VisualCard>
    </>
  );
}
