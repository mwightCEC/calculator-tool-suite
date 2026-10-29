import type { Metadata } from 'next';
import { BandwidthCalculator } from './_components/BandwidthCalculator';

export const metadata: Metadata = {
  title: 'Bandwidth',
  description: 'Estimate network bandwidth for camera streams and remote viewing.',
};

export default function BandwidthPage() {
  return <BandwidthCalculator />;
}
