import type { LensFovResult } from '@cctv/calc-core';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import { VisualCard } from '../visuals/VisualCard';
import { DensityGuidance } from './DensityGuidance';
import { LensComparison } from './LensComparison';

interface LensBreakdownCardProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
  onSelectLens: (focalLengthMm: number) => void;
}

/** Under the results card: other lenses on this camera, and pixel density guidance. */
export function LensBreakdownCard({ state, result, onSelectLens }: LensBreakdownCardProps) {
  return (
    <VisualCard
      title="Lens and pixel density"
      description="Compare common lenses on this camera, and see how the pixel density relates to one published set of levels."
    >
      <LensComparison state={state} result={result} onSelectLens={onSelectLens} />
      <DensityGuidance />
    </VisualCard>
  );
}
