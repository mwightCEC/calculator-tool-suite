'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { formatDensity, formatLength } from '../_lib/lens-fov-labels';
import { useLensFovCalculator } from '../_state/use-lens-fov-calculator';
import { CameraFields } from './CameraFields';
import { FovSummary, RESULTS_CARD_ID } from './FovSummary';
import { TargetSection } from './TargetSection';
import classes from './LensFovCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function LensFovCalculator() {
  const { state, result, actions } = useLensFovCalculator();
  const unit = state.lengthUnit;

  return (
    <div className={classes.layout}>
      <Stack gap="md" className={classes.inputs}>
        <Paper
          component="section"
          withBorder
          radius="lg"
          className={classes.section}
          aria-labelledby="camera-configuration-title"
        >
          <div>
            <Title order={2} id="camera-configuration-title" className={classes.title}>
              Camera configuration
            </Title>
            <Text size="sm" className={classes.description}>
              Enter the camera and lens, then the distance to the target or the DORI level to reach.
            </Text>
          </div>
          <CameraFields state={state} actions={actions} />
          <TargetSection state={state} actions={actions} />
        </Paper>
      </Stack>

      <div className={classes.results}>
        <FovSummary state={state} result={result} />
      </div>

      <MobileResultBar
        label={state.solveFor === 'coverage' ? 'Coverage width' : 'Farthest distance'}
        value={formatLength(
          state.solveFor === 'coverage' ? result.horizontalCoverageM : result.distanceM,
          unit
        )}
        detail={formatDensity(result.pixelsPerMetre, unit)}
        resultsId={RESULTS_CARD_ID}
      />
    </div>
  );
}
