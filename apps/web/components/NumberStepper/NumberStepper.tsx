'use client';

import { IconMinus, IconPlus } from '@tabler/icons-react';
import { ActionIcon, Group, NumberInput } from '@mantine/core';
import { useNumberDraft } from '../../hooks/use-number-draft';
import classes from './NumberStepper.module.css';

interface NumberStepperProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Amount the buttons add or remove. Typed values snap to min + n·step. */
  step?: number;
  /** Used in the button labels, e.g. "camera" → "Remove one camera". */
  unitLabel: string;
}

/** Whole-number input flanked by − and + buttons. */
export function NumberStepper({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  unitLabel,
}: NumberStepperProps) {
  const snap = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    const snapped = min + Math.ceil((clamped - min) / step) * step;
    return snapped > max ? snapped - step : snapped;
  };
  const { draft, handleChange, handleBlur } = useNumberDraft({ value, onChange, sanitize: snap });

  return (
    <Group gap={6} wrap="nowrap">
      <ActionIcon
        variant="default"
        size="input-sm"
        onClick={() => onChange(snap(value - step))}
        disabled={value <= min}
        aria-label={`Remove ${step === 1 ? 'one' : step} ${unitLabel}`}
      >
        <IconMinus size={16} />
      </ActionIcon>
      <NumberInput
        id={id}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="none"
        hideControls
        classNames={{ root: classes.inputRoot, input: classes.input }}
      />
      <ActionIcon
        variant="default"
        size="input-sm"
        onClick={() => onChange(snap(value + step))}
        disabled={value + step > max}
        aria-label={`Add ${step === 1 ? 'one' : step} ${unitLabel}`}
      >
        <IconPlus size={16} />
      </ActionIcon>
    </Group>
  );
}
