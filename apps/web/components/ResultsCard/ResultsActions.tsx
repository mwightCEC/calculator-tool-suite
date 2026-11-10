'use client';

import { IconFileExport } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { CopyLinkButton } from '../CopyLinkButton/CopyLinkButton';

interface ResultsActionsProps {
  /** Share link for the current state, built on click. */
  getShareUrl: () => string;
}

/**
 * Copy link and Export, compact, for a results card's title row (ResultsPanel `actions`).
 * Export opens the print dialog with the calculator's PrintSummary; "Save as PDF" gives a file.
 */
export function ResultsActions({ getShareUrl }: ResultsActionsProps) {
  return (
    <>
      <CopyLinkButton size="compact-sm" getShareUrl={getShareUrl} />
      <Button
        size="compact-sm"
        leftSection={<IconFileExport size={16} />}
        onClick={() => window.print()}
      >
        Export
      </Button>
    </>
  );
}
