import '@mantine/core/styles.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '../theme/theme';
import './global.css';

export const metadata: Metadata = {
  title: 'CCTV tool suite',
  description: 'Calculators for CCTV installers and system designers.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
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
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
