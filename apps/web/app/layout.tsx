import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AppLayout } from '../components/AppLayout/AppLayout';
import { cssVariablesResolver, theme } from '../theme/theme';
import './global.css';

// Self-hosted at build time; theme.ts reads the family from this CSS variable.
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' });

export const metadata: Metadata = {
  title: { default: 'Clinton Tool Suite', template: '%s · Clinton Tool Suite' },
  description: 'Calculators for CCTV installers and system designers.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={interTight.variable} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          defaultColorScheme="auto"
        >
          <Notifications position="top-right" />
          <AppLayout>{children}</AppLayout>
        </MantineProvider>
      </body>
    </html>
  );
}
