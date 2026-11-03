'use client';

import { useState } from 'react';
import type { LensFovResult } from '@cctv/calc-core';
import { Group, Paper, SegmentedControl, Switch, Text, Title } from '@mantine/core';
import { formatLength } from '../../_lib/lens-fov-labels';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { CameraView } from './CameraView';
import { CoverageDiagram, DoriLegend } from './CoverageDiagram';
import classes from './Visuals.module.css';

const VIEWS = [
  { value: 'camera', label: 'Camera view' },
  { value: 'coverage', label: 'Coverage' },
] as const;
type View = (typeof VIEWS)[number]['value'];

interface VisualsCardProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
}

/** Full-width card under the inputs and results: the camera view or the top-down coverage. */
export function VisualsCard({ state, result }: VisualsCardProps) {
  const [view, setView] = useState<View>('camera');
  const [showPixelGrid, setShowPixelGrid] = useState(false);
  const unit = state.lengthUnit;
  const distance = formatLength(result.distanceM, unit);

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      className={classes.card}
      aria-labelledby="lens-visuals-title"
    >
      <Group justify="space-between" align="flex-start" gap="sm">
        <div>
          <Title order={2} id="lens-visuals-title" className={classes.title}>
            {view === 'camera' ? 'Camera view' : 'Coverage'}
          </Title>
          <Text size="sm" className={classes.description}>
            {view === 'camera'
              ? `The target plane at ${distance}, drawn to scale at the camera's aspect ratio. An illustration for scale, not a simulated image.`
              : 'Seen from above, to scale. Shading shows how far each DORI level reaches with this lens.'}
          </Text>
        </div>
        <SegmentedControl
          data={[...VIEWS]}
          value={view}
          onChange={(value) => setView(value === 'coverage' ? 'coverage' : 'camera')}
          aria-label="Visual"
        />
      </Group>

      {view === 'camera' ? (
        <>
          <CameraView
            result={result}
            unit={unit}
            focalLengthMm={state.focalLengthMm}
            showPixelGrid={showPixelGrid}
          />
          <Switch
            checked={showPixelGrid}
            onChange={(event) => setShowPixelGrid(event.currentTarget.checked)}
            label="Show pixel grid"
            description={`Blocks of image pixels and a 1 ${unit} square on the target plane. Shows how pixels map onto the scene, not how sharp it will look.`}
          />
        </>
      ) : (
        <>
          <CoverageDiagram
            result={result}
            unit={unit}
            distancePrefix={state.solveFor === 'distance' ? 'Farthest' : undefined}
          />
          <DoriLegend />
          <Text className={classes.note}>
            The distances assume a distortion-free lens aimed straight ahead; mounting height and
            tilt aren&apos;t modelled.
          </Text>
        </>
      )}
    </Paper>
  );
}
