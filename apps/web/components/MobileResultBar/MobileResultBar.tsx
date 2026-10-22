'use client';

import { Box, Button, Group, Text } from '@mantine/core';
import classes from './MobileResultBar.module.css';

interface MobileResultBarProps {
  label: string;
  value: string;
  /** Shown after the value, e.g. "likely 30–48 TB"; null for none. */
  detail: string | null;
  /** Id of the results card that "Details" scrolls to and focuses. */
  resultsId: string;
}

/** Slim sticky bar with the headline result, shown when results are below the inputs. */
export function MobileResultBar({ label, value, detail, resultsId }: MobileResultBarProps) {
  const showDetails = () => {
    const card = document.getElementById(resultsId);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card?.focus({ preventScroll: true });
  };

  return (
    <Box hiddenFrom="lg" className={classes.bar}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <div className={classes.text}>
          <Text className={classes.label}>{label}</Text>
          <Text className={classes.value}>
            {value}
            {detail && <span className={classes.range}> · {detail}</span>}
          </Text>
        </div>
        <Button variant="outline" size="compact-sm" onClick={showDetails}>
          Details
        </Button>
      </Group>
    </Box>
  );
}
