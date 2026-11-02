'use client';

import { NativeSelect } from '@mantine/core';
import classes from './UnitSelect.module.css';

/** Width to give an input's right section that holds a UnitSelect. */
export const UNIT_SELECT_WIDTH = 64;

const CHEVRON_WIDTH = 20;

interface UnitSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  'aria-label': string;
}

/**
 * A small unit picker (ft / m, AWG / mm²) for an input's right section, so the
 * unit sits inside the field instead of beside it.
 */
export function UnitSelect<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
}: UnitSelectProps<T>) {
  return (
    <NativeSelect
      variant="unstyled"
      size="xs"
      value={value}
      onChange={(event) => {
        const option = options.find((candidate) => candidate.value === event.currentTarget.value);
        if (option) {
          onChange(option.value);
        }
      }}
      data={[...options]}
      aria-label={ariaLabel}
      rightSectionWidth={CHEVRON_WIDTH}
      classNames={{ root: classes.root, input: classes.input }}
    />
  );
}
