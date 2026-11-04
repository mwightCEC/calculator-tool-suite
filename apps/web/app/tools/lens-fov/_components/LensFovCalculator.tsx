'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { formatDensity } from '../_lib/lens-fov-labels';
import { describeHeadline } from '../_lib/result-summary';
import { useLensFovCalculator } from '../_state/use-lens-fov-calculator';
import { CameraFields } from './CameraFields';
import { PrintSummary } from './PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { TargetSection } from './TargetSection';
import { LensVisuals } from './visuals/LensVisuals';
import classes from './LensFovCalculator.module.css';

/**
 * Two columns on large screens: the drawings on the left, and the camera configuration
 * above the results on the right, kept in view so the drawings change as the inputs do.
 */
export function LensFovCalculator() {
  const { state, result, actions } = useLensFovCalculator();
  const headline = describeHeadline(state, result);

  return (
    <>
      <div className={classes.layout}>
        <div className={classes.split}>
          <Stack gap="md" className={classes.visuals}>
            <LensVisuals state={state} result={result} />
          </Stack>

          <Stack gap="md" className={classes.side}>
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
            <ResultsCard result={result} state={state} onSelectLens={actions.setFocalLength} />
          </Stack>
        </div>

        <MobileResultBar
          label={headline.label}
          value={headline.value}
          detail={formatDensity(result.pixelsPerMetre, state.lengthUnit)}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
