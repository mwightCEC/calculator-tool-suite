import { createContext, useContext, type ReactNode } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { ActionIcon, Text, Tooltip } from '@mantine/core';
import classes from './FieldRow.module.css';

/** Id of a FieldRow's label, for controls that use aria-labelledby (e.g. radio groups). */
export function fieldLabelId(controlId: string): string {
  return `${controlId}-label`;
}

/**
 * How FieldRows inside lay out: "row" puts the label beside the control (the default),
 * "stacked" puts it above a full-width control, for fields arranged in a grid.
 */
export type FieldLayout = 'row' | 'stacked';

const FieldLayoutContext = createContext<FieldLayout>('row');

export const FieldLayoutProvider = FieldLayoutContext.Provider;

interface FieldRowProps {
  label: string;
  /** Explanation shown in the info tooltip. */
  help: ReactNode;
  /** Id of the control, so the label can point at it. */
  controlId: string;
  /** De-emphasise the row, e.g. when the field doesn't affect the result. */
  dimmed?: boolean;
  /** Short helper text below the control. */
  note?: ReactNode;
  children: ReactNode;
}

/** One form field: label with an info tooltip, and the control beside or below it (FieldLayout). */
export function FieldRow({ label, help, controlId, dimmed, note, children }: FieldRowProps) {
  const layout = useContext(FieldLayoutContext);
  return (
    <div className={classes.row} data-layout={layout} data-dimmed={dimmed || undefined}>
      <div className={classes.labelCell}>
        <label id={fieldLabelId(controlId)} htmlFor={controlId} className={classes.label}>
          {label}
        </label>
        <Tooltip
          label={help}
          multiline
          w={260}
          withArrow
          events={{ hover: true, focus: true, touch: true }}
        >
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label={`About ${label}`}>
            <IconInfoCircle size={16} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      </div>
      <div className={classes.controlCell}>
        {children}
        {note && (
          <Text size="xs" className={classes.note}>
            {note}
          </Text>
        )}
      </div>
    </div>
  );
}
