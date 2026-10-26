'use client';

import { useState } from 'react';
import { MAX_CABLE_LENGTH, type CableLengthUnit } from '@cctv/calc-core';
import { NumberInput } from '@mantine/core';
import classes from './PoeCalculator.module.css';

const MIN_LENGTH = 0.1;

const sanitize = (length: number) =>
  Math.min(MAX_CABLE_LENGTH, Math.max(MIN_LENGTH, Math.round(length * 10) / 10));

interface CableLengthInputProps {
  id: string;
  /** Null when the field is empty (100 m assumed). */
  value: number | null;
  unit: CableLengthUnit;
  onChange: (length: number | null) => void;
}

/**
 * The group's longest cable run, which may be left empty. Valid numbers commit
 * as they are typed; clearing the field goes back to the 100 m assumption.
 */
export function CableLengthInput({ id, value, unit, onChange }: CableLengthInputProps) {
  const [draft, setDraft] = useState<number | string>(value ?? '');
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes (such as a unit switch) without an effect.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value ?? '');
  }

  const handleChange = (next: number | string) => {
    setDraft(next);
    if (next === '') {
      onChange(null);
    } else if (typeof next === 'number' && sanitize(next) === next) {
      onChange(next);
    }
  };

  const handleBlur = () => {
    const committed = typeof draft === 'number' ? sanitize(draft) : null;
    setDraft(committed ?? '');
    if (committed !== value) {
      onChange(committed);
    }
  };

  return (
    <NumberInput
      id={id}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={unit === 'ft' ? '328' : '100'}
      min={MIN_LENGTH}
      max={MAX_CABLE_LENGTH}
      decimalScale={1}
      allowNegative={false}
      clampBehavior="none"
      hideControls
      rightSection={unit}
      rightSectionWidth={32}
      classNames={{ input: classes.numberInput, section: classes.unitSection }}
    />
  );
}
