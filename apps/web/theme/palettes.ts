import type { MantineColorsTuple } from '@mantine/core';

/**
 * Brand primary built around #127EC0.
 * Shade 6 is the filled colour; Mantine uses shade 7 (#0F6CA6) for filled hover.
 *
 * Contrast note: white text on #127EC0 is ~4.40:1, just below WCAG AA (4.5:1)
 * for small text. Keeping #127EC0 as the filled shade was an explicit product
 * decision (2026-10-13). Shade 7 meets AA (~5.65:1) if this is revisited.
 */
export const brand: MantineColorsTuple = [
  '#e7f8ff',
  '#d4ecfb',
  '#a8d7f4',
  '#79c1ee',
  '#54aee9',
  '#3ea2e6',
  '#127ec0',
  '#0f6ca6',
  '#0b5785',
  '#074266',
];

/**
 * Navy palette for app chrome. Shades 2, 3, 6, 7 and 8 are the specified
 * design values; the remaining shades are interpolated to complete the tuple.
 */
export const navy: MantineColorsTuple = [
  '#e6f0fa',
  '#cfe2f7',
  '#b5d4f4', // icons on navy
  '#85b7eb', // labels on navy
  '#608bb4',
  '#3c6180',
  '#1b3a50', // hover states, metric tiles
  '#132f45', // sidebar
  '#0f2536', // header, results card
  '#091826',
];

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
  { color: '#127EC0', tint: '#E3F0F7' },
  { color: '#1D9E75', tint: '#E4F3EE' },
  { color: '#EF9F27', tint: '#FDF3E5' },
  { color: '#D85A30', tint: '#FAEBE6' },
  { color: '#7F77DD', tint: '#F0EFFB' },
  { color: '#D4537E', tint: '#FAEAF0' },
];
