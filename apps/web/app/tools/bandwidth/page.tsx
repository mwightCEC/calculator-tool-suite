import type { Metadata } from 'next';
import { Text, Title } from '@mantine/core';
import { BandwidthCalculator } from './_components/BandwidthCalculator';

export const metadata: Metadata = {
  title: 'Bandwidth',
  description: 'Estimate network bandwidth for camera streams and remote viewing.',
};

export default function BandwidthPage() {
  return (
    <BandwidthCalculator
      header={
        <div>
          <Title order={1}>Bandwidth Calculator</Title>
          <Text c="dimmed">Estimate network bandwidth for camera streams and remote viewing.</Text>
        </div>
      }
    />
  );
}
