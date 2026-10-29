import type { Metadata } from 'next';
import { StorageCalculator } from './_components/StorageCalculator';

export const metadata: Metadata = {
  title: 'Storage',
  description:
    'Estimate recorder storage for a retention target, or retention from drive capacity.',
};

export default function StoragePage() {
  return <StorageCalculator />;
}
