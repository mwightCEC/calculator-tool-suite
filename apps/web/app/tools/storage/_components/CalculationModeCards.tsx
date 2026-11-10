'use client';

import type { ReactNode } from 'react';
import { CALCULATION_MODES, type CalculationMode } from '@cctv/calc-core';
import { Paper, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import { parseOption } from '../../../../lib/camera-labels';
import { CALCULATION_MODE_CARDS } from '../_lib/storage-labels';
import classes from './CalculationModeCards.module.css';

interface CalculationModeCardsProps {
  value: CalculationMode;
  onChange: (mode: CalculationMode) => void;
  /** The chosen mode's goal, under the choice cards (Retention goal or Storage configuration). */
  children?: ReactNode;
}

/** Storage needed or retention time, as two choice cards, then that mode's goal. */
export function CalculationModeCards({ value, onChange, children }: CalculationModeCardsProps) {
  return (
    <Paper component={Stack} gap="sm" withBorder radius="lg" p="sm">
      <Radio.Group
        value={value}
        onChange={(selected) => {
          const mode = parseOption(CALCULATION_MODES, selected);
          if (mode) {
            onChange(mode);
          }
        }}
        aria-label="What to calculate"
      >
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          {CALCULATION_MODES.map((mode) => (
            <Radio.Card key={mode} value={mode} radius="md" className={classes.card}>
              <Text className={classes.title}>{CALCULATION_MODE_CARDS[mode].title}</Text>
              <Text className={classes.description}>
                {CALCULATION_MODE_CARDS[mode].description}
              </Text>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
      {children}
    </Paper>
  );
}
