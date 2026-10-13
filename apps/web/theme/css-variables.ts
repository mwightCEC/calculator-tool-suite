import { rgba, type CSSVariablesResolver } from '@mantine/core';
import { groupColors, navy } from './palettes';

/** Group colour tints for dark mode: translucent so they sit on dark surfaces. */
const DARK_TINT_ALPHA = 0.18;

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
 */
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    '--app-chrome-header-bg': navy[8],
    '--app-chrome-sidebar-bg': navy[7],
    '--app-chrome-hover-bg': navy[6],
    '--app-chrome-icon': navy[2],
    '--app-chrome-label': navy[3],
  },
  light: {
    '--app-focus-ring': theme.colors.gray[6],
    '--app-input-focus-border': theme.colors.gray[6],
    ...groupColorVariables((_color, tint) => tint),
  },
  dark: {
    '--app-focus-ring': theme.colors.dark[1],
    '--app-input-focus-border': theme.colors.dark[1],
    ...groupColorVariables((color) => rgba(color, DARK_TINT_ALPHA)),
  },
});
