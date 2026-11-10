'use client';

import { Paper, Stack, Title } from '@mantine/core';
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
 * Two columns on large screens: the inputs, then the drawings, on the left, and the results
 * with the lens and pixel density card on the right, kept in view so the figures change as
 * the inputs do. One column on smaller screens: inputs, results, then the drawings.
 */
export function LensFovCalculator() {
  const { state, result, actions, session } = useLensFovCalculator();
  const headline = describeHeadline(state, result);

  return (
    <>
      <RestoredSessionBanner session={session} />
      <div className={classes.layout}>
        <div className={classes.split}>
          {/* Inputs, then results, then the drawings: a phone reaches the inputs first. */}
          <Stack gap="md" className={classes.inputs}>
            <TargetSection state={state} actions={actions} />
            <Paper
              component="section"
              withBorder
              radius="lg"
              className={classes.section}
              aria-labelledby="camera-configuration-title"
            >
              <Title order={2} id="camera-configuration-title" className={classes.title}>
                Camera configuration
              </Title>
              <CameraFields state={state} actions={actions} />
            </Paper>
          </Stack>

          <Stack gap="md" className={classes.results}>
            <ResultsCard result={result} state={state} />
            <LensBreakdownCard
              state={state}
              result={result}
              onSelectLens={actions.setFocalLength}
            />
          </Stack>

          <Stack gap="md" className={classes.visuals}>
            <LensVisuals state={state} result={result} />
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
