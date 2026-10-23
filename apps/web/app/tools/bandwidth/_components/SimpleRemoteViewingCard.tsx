'use client';

import type { NetworkLinks, RemoteViewing } from '@cctv/calc-core';
import { Text } from '@mantine/core';
import { SIMPLE_BANDWIDTH_SETTINGS } from '../_state/bandwidth-calculator-state';
import { InputCard } from './InputCard';
import { SiteUploadField } from './NetworkChecksCard';
import { ViewersField } from './RemoteViewingCard';
import classes from './BandwidthCalculator.module.css';

interface SimpleRemoteViewingCardProps {
  viewers: number;
  siteUploadMbps: number | null;
  onRemoteViewingChange: (changes: Partial<RemoteViewing>) => void;
  onNetworkChange: (changes: Partial<NetworkLinks>) => void;
}

/** Simple mode's system settings: remote viewers and the optional site upload check. */
export function SimpleRemoteViewingCard({
  viewers,
  siteUploadMbps,
  onRemoteViewingChange,
  onNetworkChange,
}: SimpleRemoteViewingCardProps) {
  return (
    <InputCard id="bandwidth-simple-remote-title" title="Remote viewing">
      <ViewersField
        viewers={viewers}
        onChange={(value) => onRemoteViewingChange({ viewers: value })}
      />
      <SiteUploadField
        siteUploadMbps={siteUploadMbps}
        onChange={(value) => onNetworkChange({ siteUploadMbps: value })}
      />
      <Text size="sm" className={classes.secondaryText}>
        Each viewer watches {SIMPLE_BANDWIDTH_SETTINGS.camerasPerViewer} cameras on the sub-stream
        (D1). Recording uses the main stream, with {SIMPLE_BANDWIDTH_SETTINGS.overheadPercent}%
        overhead. Switch to Advanced to change these.
      </Text>
    </InputCard>
  );
}
