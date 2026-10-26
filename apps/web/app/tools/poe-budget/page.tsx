import type { Metadata } from 'next';
import { Text, Title } from '@mantine/core';
import { PoeCalculator } from './_components/PoeCalculator';

export const metadata: Metadata = {
  title: 'PoE budget',
  description: 'Check camera power draw against a switch or NVR PoE budget.',
};

export default function PoeBudgetPage() {
  return (
    <PoeCalculator
      header={
        <div>
          <Title order={1}>PoE Budget Calculator</Title>
          <Text c="dimmed">Check camera power draw against a switch or NVR PoE budget.</Text>
        </div>
      }
    />
  );
}
