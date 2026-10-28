import type { Metadata } from 'next';
import { Text, Title } from '@mantine/core';
import { VoltageDropCalculator } from './_components/VoltageDropCalculator';

export const metadata: Metadata = {
  title: 'Voltage drop',
  description: 'Check voltage drop on low-voltage power runs to cameras and other devices.',
};

export default function VoltageDropPage() {
  return (
    <VoltageDropCalculator
      header={
        <div>
          <Title order={1}>Voltage Drop Calculator</Title>
          <Text c="dimmed">
            Check voltage drop on low-voltage power runs to cameras and other devices.
          </Text>
        </div>
      }
    />
  );
}
