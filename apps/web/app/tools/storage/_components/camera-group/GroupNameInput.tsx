'use client';

import { useState, type KeyboardEvent } from 'react';
import { MAX_GROUP_NAME_LENGTH } from '@cctv/calc-core';
import { TextInput } from '@mantine/core';
import classes from './CameraGroupCard.module.css';

interface GroupNameInputProps {
  value: string;
  onChange: (name: string) => void;
}

/** Group name that reads as a heading and edits in place. Empty names revert. */
export function GroupNameInput({ value, onChange }: GroupNameInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = () => {
    const name = draft.trim();
    if (name && name !== value) {
      onChange(name);
    } else {
      setDraft(value);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      const input = event.currentTarget;
      setDraft(value);
      // Blur after the revert renders, so the blur handler sees the original name.
      requestAnimationFrame(() => input.blur());
    }
  };

  return (
    <TextInput
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      maxLength={MAX_GROUP_NAME_LENGTH}
      variant="unstyled"
      aria-label="Camera group name"
      classNames={{ root: classes.nameRoot, input: classes.nameInput }}
    />
  );
}
