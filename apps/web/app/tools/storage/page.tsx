import type { Metadata } from 'next';
import { Text, Title } from '@mantine/core';
import { StorageCalculator } from './_components/StorageCalculator';

export const metadata: Metadata = {
  title: 'Storage',
  description:
    'Estimate recorder storage for a retention target, or retention from drive capacity.',
};

export default function StoragePage() {
  return (
    <StorageCalculator
      header={
        <div>
          <Title order={1}>Storage calculator</Title>
          <Text c="dimmed">
            Size recorder drives for a retention target, or estimate retention from capacity.
          </Text>
        </div>
      }
    />
  );
}
