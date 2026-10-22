'use client';

import { useState } from 'react';
import { IconCheck, IconLink } from '@tabler/icons-react';
import { Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import classes from './CopyLinkButton.module.css';

const COPIED_FEEDBACK_MS = 2000;

interface CopyLinkButtonProps {
  /** Share link for the current state, built on click (see the calculator's share-link module). */
  getShareUrl: () => string;
}

/** Copies a link that reproduces the current calculation. */
export function CopyLinkButton({ getShareUrl }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    // Built from the current state, so it is correct even before the address bar updates.
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard access can be blocked (permissions, non-secure context): show the link instead.
      notifications.show({
        color: 'amber',
        title: 'Couldn’t copy automatically',
        message: (
          <Text size="sm" className={classes.url}>
            Copy this link: {url}
          </Text>
        ),
        autoClose: false,
      });
    }
  };

  return (
    <Button
      variant="outline"
      leftSection={copied ? <IconCheck size={16} /> : <IconLink size={16} />}
      onClick={copyLink}
      aria-live="polite"
    >
      {copied ? 'Link copied' : 'Copy link'}
    </Button>
  );
}
