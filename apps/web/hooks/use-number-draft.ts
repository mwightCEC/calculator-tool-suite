import { useState } from 'react';

interface NumberDraftOptions {
  value: number;
  onChange: (value: number) => void;
  /** Turns a typed number into an allowed value (clamp, round, snap to step). */
  sanitize: (value: number) => number;
}

/**
 * Lets a NumberInput be cleared and retyped without losing the committed value.
 * Valid numbers commit as they are typed; on blur the field snaps to the
 * sanitised value, or back to the last committed value if it was left empty.
 */
export function useNumberDraft({ value, onChange, sanitize }: NumberDraftOptions) {
  const [draft, setDraft] = useState<number | string>(value);
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes (stepper buttons, other inputs) without an effect.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const handleChange = (next: number | string) => {
    setDraft(next);
    if (typeof next === 'number' && sanitize(next) === next) {
      onChange(next);
    }
  };

  const handleBlur = () => {
    const committed = typeof draft === 'number' ? sanitize(draft) : value;
    setDraft(committed);
    if (committed !== value) {
      onChange(committed);
    }
  };

  return { draft, handleChange, handleBlur };
}
