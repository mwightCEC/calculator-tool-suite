import type { ActionIconVariant } from '@mantine/core';

/** "chrome": subtle icon button for the navy header, sidebar and drawer. See theme.ts. */
type ExtendedActionIconVariant = ActionIconVariant | 'chrome';

declare module '@mantine/core' {
  export interface ActionIconProps {
    variant?: ExtendedActionIconVariant;
  }
}
