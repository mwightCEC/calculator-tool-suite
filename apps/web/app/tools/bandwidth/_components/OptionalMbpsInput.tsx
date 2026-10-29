'use client';

import { useState } from 'react';
import { MAX_LINK_CAPACITY_MBPS } from '@cctv/calc-core';
import { NumberInput } from '@mantine/core';
import classes from './BandwidthCalculator.module.css';

const MIN_MBPS = 0.1;

const sanitize = (mbps: number) =>
  Math.min(MAX_LINK_CAPACITY_MBPS, Math.max(MIN_MBPS, Math.round(mbps * 10) / 10));

interface OptionalMbpsInputProps {
  id: string;
  /** Null when the field is empty (the check is off). */
  value: number | null;
  onChange: (mbps: number | null) => void;
}

/**
 * A link capacity in Mbps that may be left empty. Valid numbers commit as they
 * are typed; clearing the field turns the check off.
 */
export function OptionalMbpsInput({ id, value, onChange }: OptionalMbpsInputProps) {
  const [draft, setDraft] = useState<number | string>(value ?? '');
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes without an effect.
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
      placeholder="Off"
      min={MIN_MBPS}
      max={MAX_LINK_CAPACITY_MBPS}
      decimalScale={1}
      allowNegative={false}
      clampBehavior="none"
      hideControls
      rightSection="Mbps"
      rightSectionWidth={48}
      classNames={{ root: classes.mbpsInput, section: classes.unitSection }}
    />
  );
}
