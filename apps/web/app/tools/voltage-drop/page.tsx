import type { Metadata } from 'next';
import { VoltageDropCalculator } from './_components/VoltageDropCalculator';

export const metadata: Metadata = {
  title: 'Voltage drop',
  description: 'Check voltage drop on low-voltage power runs to cameras and other devices.',
};

export default function VoltageDropPage() {
  return <VoltageDropCalculator />;
}
