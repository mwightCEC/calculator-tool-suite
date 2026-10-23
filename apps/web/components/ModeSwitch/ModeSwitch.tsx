'use client';

import { SegmentedControl } from '@mantine/core';
import { INPUT_MODE_OPTIONS, INPUT_MODES, type InputMode } from '../../lib/input-mode';

interface ModeSwitchProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
}

/** Page-level Simple | Advanced switch for calculators with camera groups. */
export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  return (
    <SegmentedControl
      size="sm"
      color="brand"
      value={value}
      onChange={(selected) => {
        const mode = INPUT_MODES.find((candidate) => candidate === selected);
        if (mode) {
          onChange(mode);
        }
      }}
      data={INPUT_MODE_OPTIONS}
      aria-label="Input mode"
    />
  );
}
