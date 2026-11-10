'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { RestoredSessionBanner } from '../../../../components/RestoredSessionBanner/RestoredSessionBanner';
import { formatDensity } from '../_lib/lens-fov-labels';
import { describeHeadline } from '../_lib/result-summary';
import { useLensFovCalculator } from '../_state/use-lens-fov-calculator';
import { LensBreakdownCard } from './breakdown/LensBreakdownCard';
import { CameraFields } from './CameraFields';
import { PrintSummary } from './PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { TargetSection } from './TargetSection';
import { LensVisuals } from './visuals/LensVisuals';
import classes from './LensFovCalculator.module.css';

/**
 * Two columns on large screens: the drawings and lens breakdown on the left, and the results
 * above the camera configuration on the right, kept in view so the drawings change as the
 * inputs do. One column on smaller screens, inputs and results first.
 */
export function LensFovCalculator() {
  const { state, result, actions, session } = useLensFovCalculator();
  const headline = describeHeadline(state, result);

  return (
    <>
      <RestoredSessionBanner session={session} />
      <div className={classes.layout}>
        <div className={classes.split}>
          {/* Inputs and results come first, so a phone reaches the inputs before the drawings. */}
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
                  Enter the camera and lens, then the distance to the target or the pixel density to
                  reach.
                </Text>
              </div>
              <CameraFields state={state} actions={actions} />
              <TargetSection state={state} actions={actions} />
            </Paper>
            {/* Above the configuration on large screens; after it on phones. */}
            <div className={classes.results}>
              <ResultsCard result={result} state={state} />
            </div>
          </Stack>

          <Stack gap="md" className={classes.visuals}>
            <LensVisuals state={state} result={result} />
            <LensBreakdownCard
              state={state}
              result={result}
              onSelectLens={actions.setFocalLength}
            />
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
