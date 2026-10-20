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
          <Title order={1}>Storage Calculator</Title>
          <Text c="dimmed">Calculate based on storage needed or with a designated capacity.</Text>
        </div>
      }
    />
  );
}
