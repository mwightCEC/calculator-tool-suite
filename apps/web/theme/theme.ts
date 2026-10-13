'use client';

import { Card, createTheme, Input, Paper, rem } from '@mantine/core';
import { cssVariablesResolver } from './css-variables';
import { brand, navy } from './palettes';
import inputClasses from './Input.module.css';

export { cssVariablesResolver };

export const theme = createTheme({
  colors: { brand, navy },
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  // Picks dark text on light fills (e.g. amber badges). White is still chosen
  // on brand.6 because its luminance is below the threshold.
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
    Card: Card.extend({ defaultProps: { radius: 'md' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
    Input: Input.extend({ classNames: { input: inputClasses.input } }),
  },
});
