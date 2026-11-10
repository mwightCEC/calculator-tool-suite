import type { Metadata } from 'next';
import { FaqPage } from './_components/FaqPage';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'How each calculator works out its results, and the assumptions behind them.',
};

export default function Faq() {
  return <FaqPage />;
}
