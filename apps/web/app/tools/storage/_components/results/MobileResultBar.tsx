'use client';

import type { StorageCalculationResult } from '@cctv/calc-core';
import { Box, Button, Group, Text } from '@mantine/core';
import { describeHeadline } from '../../_lib/result-summary';
import { RESULTS_CARD_ID } from './ResultsCard';
import classes from './MobileResultBar.module.css';

/** Slim sticky bar with the headline result, shown when results are below the inputs. */
export function MobileResultBar({ result }: { result: StorageCalculationResult }) {
  const headline = describeHeadline(result);

  const showDetails = () => {
    const card = document.getElementById(RESULTS_CARD_ID);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card?.focus({ preventScroll: true });
  };

  return (
    <Box hiddenFrom="lg" className={classes.bar}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <div className={classes.text}>
          <Text className={classes.label}>{headline.label}</Text>
          <Text className={classes.value}>
            {headline.value}
            {headline.likelyRange && (
              <span className={classes.range}> · {headline.likelyRange}</span>
            )}
          </Text>
        </div>
        <Button variant="outline" color="navy.2" size="compact-sm" onClick={showDetails}>
          Details
        </Button>
      </Group>
    </Box>
  );
}
