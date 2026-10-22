import { rgba, type CSSVariablesResolver } from '@mantine/core';
import { amber, brand, clintonGray, groupColors } from './palettes';

/** Group colour tints for dark mode: translucent so they sit on dark surfaces. */
const DARK_TINT_ALPHA = 0.18;

/** Status text dark enough for AA on white (Mantine's greens are too light). */
// Capacity bar overhead colours: outside the camera-group palette so footage stays distinct.
const CAPACITY_RESERVE = { light: '#64748B', dark: '#8A9AB0' }; // slate
const CAPACITY_PARITY = { light: '#2F5D62', dark: '#4E8F94' }; // dark teal-gray

const STATUS_OK_ON_LIGHT = '#237032';

function groupColorVariables(tintFor: (color: string, tint: string) => string) {
  return Object.fromEntries(
    groupColors.flatMap(({ color, tint }, index) => [
      [`--group-color-${index}`, color],
      [`--group-tint-${index}`, tintFor(color, tint)],
    ])
  );
}

/**
 * Semantic application tokens. CSS Modules should use these rather than
 * repeating palette hex values.
 *
 * - header:  brand-blue bar with white content, in both colour schemes
 * - sidebar: light gray navigation (dark gray in dark mode)
 * - surface/accent/status: the results card and other content surfaces
 */
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    '--app-header-bg': brand[6],
    '--app-header-fg': theme.white,
    '--app-header-hover-bg': brand[7],
  },
  light: {
    '--app-focus-ring': theme.colors.gray[6],
    '--app-input-focus-border': theme.colors.gray[6],
    // Secondary text that still meets AA on light neutral fills (dimmed does not).
    '--app-text-secondary': clintonGray.secondary,

    '--app-sidebar-bg': clintonGray.surface,
    '--app-sidebar-border': clintonGray.line,
    '--app-sidebar-hover-bg': clintonGray.line,
    '--app-sidebar-text': clintonGray.text,
    '--app-sidebar-icon': clintonGray.secondary,
    '--app-sidebar-label': clintonGray.secondary,

    '--app-surface-subtle': clintonGray.band,
    '--app-accent-text': brand[6],
    '--app-status-ok': STATUS_OK_ON_LIGHT,
    '--app-status-warn': amber[9],
    '--app-status-danger': theme.colors.red[9],
    '--app-capacity-reserve': CAPACITY_RESERVE.light,
    '--app-capacity-parity': CAPACITY_PARITY.light,
    '--app-capacity-unused': theme.colors.gray[2],
    ...groupColorVariables((_color, tint) => tint),
  },
  dark: {
    '--app-focus-ring': theme.colors.dark[1],
    '--app-input-focus-border': theme.colors.dark[1],
    '--app-text-secondary': theme.colors.dark[1],

    '--app-sidebar-bg': theme.colors.dark[6],
    '--app-sidebar-border': theme.colors.dark[4],
    '--app-sidebar-hover-bg': theme.colors.dark[5],
    '--app-sidebar-text': theme.colors.dark[0],
    '--app-sidebar-icon': theme.colors.dark[1],
    '--app-sidebar-label': theme.colors.dark[1],

    '--app-surface-subtle': theme.colors.dark[6],
    // Neutral light text for result values on dark surfaces, matching field labels.
    '--app-accent-text': theme.colors.dark[0],
    '--app-status-ok': theme.colors.green[3],
    '--app-status-warn': amber[3],
    '--app-status-danger': theme.colors.red[4],
    '--app-capacity-reserve': CAPACITY_RESERVE.dark,
    '--app-capacity-parity': CAPACITY_PARITY.dark,
    '--app-capacity-unused': theme.colors.dark[4],
    ...groupColorVariables((color) => rgba(color, DARK_TINT_ALPHA)),
  },
});
