'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { formatDensity } from '../_lib/lens-fov-labels';
import { describeHeadline } from '../_lib/result-summary';
import { useLensFovCalculator } from '../_state/use-lens-fov-calculator';
import { CameraFields } from './CameraFields';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { TargetSection } from './TargetSection';
import { VisualsCard } from './visuals/VisualsCard';
import classes from './LensFovCalculator.module.css';

/**
 * Two columns on large screens, inputs on the left and sticky results on the right,
 * then the camera view and coverage across the full width.
 */
export function LensFovCalculator() {
  const { state, result, actions } = useLensFovCalculator();
  const headline = describeHeadline(state, result);

  return (
    <div className={classes.layout}>
      <div className={classes.split}>
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
                Enter the camera and lens, then the distance to the target or the DORI level to
                reach.
              </Text>
            </div>
            <CameraFields state={state} actions={actions} />
            <TargetSection state={state} actions={actions} />
          </Paper>
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} onSelectLens={actions.setFocalLength} />
        </div>
      </div>

      <VisualsCard state={state} result={result} />

      <MobileResultBar
        label={headline.label}
        value={headline.value}
        detail={formatDensity(result.pixelsPerMetre, state.lengthUnit)}
        resultsId={RESULTS_CARD_ID}
      />
    </div>
  );
}
