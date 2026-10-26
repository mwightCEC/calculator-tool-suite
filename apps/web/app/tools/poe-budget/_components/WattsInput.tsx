'use client';

import { NumberInput } from '@mantine/core';
import { useNumberDraft } from '../../../../hooks/use-number-draft';
import classes from './PoeCalculator.module.css';

interface WattsInputProps {
  id: string;
  value: number;
  onChange: (watts: number) => void;
  min: number;
  max: number;
  /** Decimal places allowed, e.g. 2 for datasheet draws such as 12.95 W. */
  decimals: number;
}

/** A power in watts. Valid numbers commit as they are typed; blur snaps to the range. */
export function WattsInput({ id, value, onChange, min, max, decimals }: WattsInputProps) {
  const factor = 10 ** decimals;
  const sanitize = (watts: number) =>
    Math.min(max, Math.max(min, Math.round(watts * factor) / factor));
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
      rightSection="W"
      rightSectionWidth={32}
      classNames={{ input: classes.numberInput, section: classes.unitSection }}
    />
  );
}
