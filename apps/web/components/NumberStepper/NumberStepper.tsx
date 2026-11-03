'use client';

import { NumberInput } from '@mantine/core';
import { useNumberDraft } from '../../hooks/use-number-draft';
import classes from './NumberStepper.module.css';

interface NumberStepperProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Amount the up / down controls add or remove. Typed values snap to min + n·step. */
  step?: number;
}

/** Whole-number input with Mantine's up / down controls. */
export function NumberStepper({ id, value, onChange, min, max, step = 1 }: NumberStepperProps) {
  const snap = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    const snapped = min + Math.ceil((clamped - min) / step) * step;
    return snapped > max ? snapped - step : snapped;
  };
  const { draft, handleChange, handleBlur, feedbackProps } = useNumberDraft({
    value,
    onChange,
    sanitize: snap,
    limits: { min, max },
  });

  return (
    <NumberInput
      id={id}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      allowDecimal={false}
      allowNegative={false}
      clampBehavior="none"
      {...feedbackProps}
      classNames={{ root: classes.root }}
    />
  );
}
