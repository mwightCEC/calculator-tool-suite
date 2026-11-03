import { useState } from 'react';
import type { InputWrapperProps } from '@mantine/core';

/** The correction note goes under the field, not between the label and the field. */
const FIELD_ORDER: InputWrapperProps['inputWrapperOrder'] = [
  'label',
  'input',
  'description',
  'error',
];

export interface NumberLimits {
  min: number;
  max: number;
  /** Formats a limit or corrected value for the message, e.g. with its unit. */
  format?: (value: number) => string;
}

interface NumberDraftOptions {
  value: number;
  onChange: (value: number) => void;
  /** Turns a typed number into an allowed value (clamp, round, snap to step). */
  sanitize: (value: number) => number;
  /** The allowed range, to explain values that are out of it or were changed. */
  limits: NumberLimits;
}

/**
 * Shown while typing a number above the maximum. A number below the minimum
 * isn't flagged yet, since the next digit may bring it into range.
 */
export function describeOverMaximum(typed: number | string, limits: NumberLimits): string | null {
  const format = limits.format ?? String;
  return typeof typed === 'number' && typed > limits.max ? `Maximum ${format(limits.max)}` : null;
}

/** Shown after blur changed a typed number, saying what it became and why. */
export function describeCorrection(
  typed: number,
  committed: number,
  limits: NumberLimits
): string | null {
  if (typed === committed) {
    return null;
  }
  const format = limits.format ?? String;
  let reason = 'the nearest allowed value';
  if (typed > limits.max) {
    reason = 'the maximum';
  } else if (typed < limits.min) {
    reason = 'the minimum';
  }
  return `Changed to ${format(committed)}, ${reason}.`;
}

/**
 * Lets a NumberInput be cleared and retyped without losing the committed value.
 * Valid numbers commit as they are typed; on blur the field snaps to the
 * sanitised value, or back to the last committed value if it was left empty.
 * `feedbackProps` (spread onto the NumberInput) flags a number over the
 * maximum while typing and says when blur changed what was typed.
 */
export function useNumberDraft({ value, onChange, sanitize, limits }: NumberDraftOptions) {
  const [draft, setDraft] = useState<number | string>(value);
  const [lastValue, setLastValue] = useState(value);
  const [correction, setCorrection] = useState<string | null>(null);

  // Follow outside changes (stepper buttons, other inputs) without an effect.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
    if (draft !== value) {
      setCorrection(null);
    }
  }

  const handleChange = (next: number | string) => {
    setDraft(next);
    setCorrection(null);
    if (typeof next === 'number' && sanitize(next) === next) {
      onChange(next);
    }
  };

  const handleBlur = () => {
    const committed = typeof draft === 'number' ? sanitize(draft) : value;
    setDraft(committed);
    setCorrection(typeof draft === 'number' ? describeCorrection(draft, committed, limits) : null);
    if (committed !== value) {
      onChange(committed);
    }
  };

  const feedbackProps = {
    error: describeOverMaximum(draft, limits),
    description: correction,
    // Announced when it appears.
    inputWrapperOrder: FIELD_ORDER,
    descriptionProps: { role: 'status' },
  };

  return { draft, handleChange, handleBlur, feedbackProps };
}
