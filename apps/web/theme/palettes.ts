import type { MantineColorsTuple } from '@mantine/core';

/**
 * Brand primary built around Clinton Electronics' site blue #0071BB.
 * Shade 6 is the filled colour (white text 5.15:1, passes WCAG AA); Mantine
 * uses shade 7 for filled hover. Shade 8 is the site's deep utility-bar blue.
 */
export const brand: MantineColorsTuple = [
  '#ebf7ff',
  '#d5ebfa',
  '#a6d6f7',
  '#76c1f6',
  '#53aef5',
  '#42a3f5',
  '#0071bb',
  '#005e9c',
  '#004a7b',
  '#003a61',
];

/** Header gradient, left to right (approved Storage prototype). White text is AA on both ends. */
export const headerGradient = { from: '#306CA9', to: '#294594' } as const;

/** Deep navy for headline values and the selected choice card (approved Storage prototype). */
export const ink = '#1C2B39';

/** Results headline tile gradient (approved Storage prototype). */
export const heroTile = { from: '#F3F6F9', to: '#EAF1F7' } as const;

/** Neutral grays sampled from the Clinton Electronics site (light scheme). */
export const clintonGray = {
  /** Light bands, metric tiles. */
  band: '#F8F8F8',
  /** Sidebar background (the site's search field). */
  surface: '#F2F2F2',
  /** Sub-navigation bar; dividers and hover. */
  line: '#DADADA',
  /** Navigation text. */
  text: '#333333',
  /** Secondary text and icons (4.6:1 or better on the grays above). */
  secondary: '#6D6D6D',
} as const;

/**
 * Amber accent built around #EF9F27 (shade 6): "soon" badges and RAID parity.
 * With theme.autoContrast, filled amber gets dark text (~9.7:1).
 */
export const amber: MantineColorsTuple = [
  '#fff6e1',
  '#feebcd',
  '#f9d6a0',
  '#f5bf6e',
  '#f3b358',
  '#f1ac43',
  '#ef9f27',
  '#d48508',
  '#bd7500',
  '#a56400',
];

export interface GroupColor {
  /** Solid colour for dots, bar segments and accents. */
  color: string;
  /** Light tint (12% of `color` over white) for badges and card footers. */
  tint: string;
}

/** Camera group colours, assigned to groups in this order. */
export const groupColors: readonly GroupColor[] = [
  { color: '#0071BB', tint: '#E0EEF7' },
  { color: '#1D9E75', tint: '#E4F3EE' },
  { color: '#EF9F27', tint: '#FDF3E5' },
  { color: '#D85A30', tint: '#FAEBE6' },
  { color: '#7F77DD', tint: '#F0EFFB' },
  { color: '#D4537E', tint: '#FAEAF0' },
];
