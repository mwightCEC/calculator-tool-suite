'use client';

import { useId } from 'react';
import { Chip, Group } from '@mantine/core';
import classes from './OptionButtons.module.css';

export interface OptionButtonsOption<T extends string> {
  value: T;
  label: string;
}

interface OptionButtonsProps<T extends string> {
  /** Id for the group element, e.g. so a <label htmlFor> can reference it. */
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly OptionButtonsOption<T>[];
  /** Id of the element that labels the group. Use this or `aria-label`. */
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

/**
 * Single-choice group of separate buttons (not a connected track).
 * Built on Chip.Group, so each option is a native radio input: arrow keys move
 * the selection and screen readers announce a radio group.
 */
export function OptionButtons<T extends string>({
  id,
  value,
  onChange,
  options,
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
}: OptionButtonsProps<T>) {
  const name = useId();

  const handleChange = (selected: string) => {
    const option = options.find((candidate) => candidate.value === selected);
    if (option) {
      onChange(option.value);
    }
  };

  return (
    <Chip.Group value={value} onChange={handleChange}>
      <Group
        id={id}
        role="radiogroup"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        gap={8}
        className={classes.group}
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            value={option.value}
            name={name}
            type="radio"
            variant="filled"
            radius="sm"
            size="sm"
            classNames={{ label: classes.label, input: classes.input }}
          >
            {option.label}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );
}
