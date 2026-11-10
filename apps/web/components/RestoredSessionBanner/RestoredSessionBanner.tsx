'use client';

import { IconHistory } from '@tabler/icons-react';
import { Alert, Button, Group, Text } from '@mantine/core';
import { describeSavedAge } from '../../lib/share/saved-age';
import type { RestoredSession } from '../../lib/share/use-url-state-sync';
import classes from './RestoredSessionBanner.module.css';

/**
 * Above a calculator that reopened with the inputs saved from the last visit, so a returning
 * user knows the figures aren't the defaults: "Restored your last session (12 min ago)",
 * with Start over (the whole calculator back to its defaults, with Undo) and a close button.
 */
export function RestoredSessionBanner({ session }: { session: RestoredSession }) {
  if (session.restoredAgeMs === null) {
    return null;
  }
  return (
    <Alert
      variant="light"
      radius="lg"
      icon={<IconHistory size={20} stroke={1.75} />}
      withCloseButton
      closeButtonLabel="Dismiss"
      onClose={session.dismiss}
      classNames={{
        root: classes.banner,
        wrapper: classes.wrapper,
        icon: classes.icon,
        closeButton: classes.close,
      }}
    >
      <Group gap="xs" justify="space-between" wrap="wrap">
        <Text size="sm">
          Restored your last session ({describeSavedAge(session.restoredAgeMs)}).
        </Text>
        <Button variant="white" size="compact-sm" onClick={session.startOver}>
          Start over
        </Button>
      </Group>
    </Alert>
  );
}
