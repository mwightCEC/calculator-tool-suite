import type { Metadata } from 'next';
import { PoeCalculator } from './_components/PoeCalculator';

export const metadata: Metadata = {
  title: 'PoE budget',
  description: 'Check camera power draw against a switch or NVR PoE budget.',
};

export default function PoeBudgetPage() {
  return <PoeCalculator />;
}
