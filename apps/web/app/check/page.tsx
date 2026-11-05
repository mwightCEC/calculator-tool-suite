import type { Metadata } from 'next';
import { CheckMySystem } from './_components/CheckMySystem';

export const metadata: Metadata = {
  title: 'Check my system',
  description: 'Checks for the products in your cart, ready to open in the calculators.',
  // Only reached from a cart link, so keep it out of search results.
  robots: { index: false },
};

export default function CheckPage() {
  return <CheckMySystem />;
}
