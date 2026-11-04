import type { Metadata } from 'next';
import { LensFovCalculator } from './_components/LensFovCalculator';

export const metadata: Metadata = {
  title: 'Lens / FOV',
  description: 'Work out field of view, coverage and pixel density for a lens and sensor.',
};

export default function LensFovPage() {
  return <LensFovCalculator />;
}
