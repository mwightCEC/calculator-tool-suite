'use client';

import type { ReactNode } from 'react';
import { NumberInput } from '@mantine/core';
import { useNumberDraft } from '../../hooks/use-number-draft';
import { formatNumber } from '../../lib/format';
import { UNIT_SELECT_WIDTH } from '../UnitSelect/UnitSelect';
import classes from './UnitInput.module.css';

interface UnitInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Decimal places allowed, e.g. 2 for a datasheet value such as 0.45 A or 12.95 W. */
  decimals: number;
  /** Shown inside the field: V, A, W, ft or m. */
  unit: string;
  /** A UnitSelect shown in place of the unit text, when the unit can be changed here. */
  unitControl?: ReactNode;
}

/** A number with its unit. Valid numbers commit as they are typed; blur snaps to the range. */
export function UnitInput({
  id,
  value,
  onChange,
  min,
  max,
  decimals,
  unit,
  unitControl,
}: UnitInputProps) {
  const factor = 10 ** decimals;
  const sanitize = (next: number) =>
    Math.min(max, Math.max(min, Math.round(next * factor) / factor));
  const { draft, handleChange, handleBlur, feedbackProps } = useNumberDraft({
    value,
    onChange,
    sanitize,
    limits: { min, max, format: (limit) => `${formatNumber(limit, decimals)} ${unit}` },
  });

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
      {...feedbackProps}
      rightSection={unitControl ?? unit}
      rightSectionWidth={unitControl ? UNIT_SELECT_WIDTH : 32}
      rightSectionPointerEvents={unitControl ? 'all' : 'none'}
      classNames={{ input: classes.input, section: classes.unit }}
    />
  );
}
