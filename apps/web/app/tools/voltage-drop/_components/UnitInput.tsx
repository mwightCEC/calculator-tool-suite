'use client';

import { NumberInput } from '@mantine/core';
import { useNumberDraft } from '../../../../hooks/use-number-draft';
import classes from './VoltageDropCalculator.module.css';

interface UnitInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Decimal places allowed, e.g. 2 for a datasheet current such as 0.45 A. */
  decimals: number;
  /** Shown inside the field: V, A, W, ft or m. */
  unit: string;
}

/** A number with its unit. Valid numbers commit as they are typed; blur snaps to the range. */
export function UnitInput({ id, value, onChange, min, max, decimals, unit }: UnitInputProps) {
  const factor = 10 ** decimals;
  const sanitize = (next: number) =>
    Math.min(max, Math.max(min, Math.round(next * factor) / factor));
  const { draft, handleChange, handleBlur } = useNumberDraft({ value, onChange, sanitize });

  return (
    <NumberInput
      id={id}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      decimalScale={decimals}
      allowNegative={false}
      clampBehavior="none"
      hideControls
      rightSection={unit}
      rightSectionWidth={32}
      classNames={{ input: classes.numberInput, section: classes.unitSection }}
    />
  );
}
