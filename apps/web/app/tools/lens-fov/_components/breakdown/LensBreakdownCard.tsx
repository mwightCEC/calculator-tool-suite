import type { LensFovResult } from '@cctv/calc-core';
import { Text } from '@mantine/core';
import { describeOptics } from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { VisualCard } from '../visuals/VisualCard';
import { DensityGuidance } from './DensityGuidance';
import { LensComparison } from './LensComparison';
import classes from './Breakdown.module.css';

interface LensBreakdownCardProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
  onSelectLens: (focalLengthMm: number) => void;
}

/** Below the drawings: other lenses on this camera, the angles, and pixel density guidance. */
export function LensBreakdownCard({ state, result, onSelectLens }: LensBreakdownCardProps) {
  return (
    <VisualCard
      title="Lens and pixel density"
      description="Compare common lenses on this camera, and see how the pixel density relates to one published set of levels."
    >
      <LensComparison state={state} result={result} onSelectLens={onSelectLens} />
      <div>
        <Text component="h3" className={classes.sectionTitle}>
          Angles and sensor
        </Text>
        <Text className={classes.optics}>{describeOptics(result)}</Text>
      </div>
      <DensityGuidance />
    </VisualCard>
  );
}
