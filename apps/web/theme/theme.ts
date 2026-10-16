'use client';

import { ActionIcon, Card, createTheme, Input, Paper, rem } from '@mantine/core';
import { cssVariablesResolver } from './css-variables';
import { amber, brand } from './palettes';
import inputClasses from './Input.module.css';

export { cssVariablesResolver };

export const theme = createTheme({
  colors: { brand, amber },
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  // Picks dark text on light fills (e.g. amber badges) and white on brand.6.
  autoContrast: true,

  // Keyboard-only focus ring; recoloured to neutral gray in app/global.css.
  focusRing: 'auto',

  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  defaultRadius: 'sm',

  components: {
    ActionIcon: ActionIcon.extend({
      // Custom "chrome" variant for icon buttons on the blue header.
      vars: (_theme, props) =>
        props.variant === 'chrome'
          ? {
              root: {
                '--ai-bg': 'transparent',
                '--ai-bd': 'none',
                '--ai-color': 'var(--app-header-fg)',
                '--ai-hover': 'var(--app-header-hover-bg)',
                '--ai-hover-color': 'var(--app-header-fg)',
              },
            }
          : { root: {} },
    }),
    Card: Card.extend({ defaultProps: { radius: 'md' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
    Input: Input.extend({ classNames: { input: inputClasses.input } }),
  },
});
