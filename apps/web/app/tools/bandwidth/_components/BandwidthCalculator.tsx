'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Stack } from '@mantine/core';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { useBandwidthCalculator } from '../_state/use-bandwidth-calculator';
import { BandwidthCameraGroupCard } from './BandwidthCameraGroupCard';
import { NetworkChecksCard } from './NetworkChecksCard';
import { OverheadCard } from './OverheadCard';
import { RecordingCard } from './RecordingCard';
import { RemoteViewingCard } from './RemoteViewingCard';
import { ResultsPlaceholderCard } from './ResultsPlaceholderCard';
import classes from './BandwidthCalculator.module.css';

interface BandwidthCalculatorProps {
  /** Server-rendered page title and introduction. */
  header: ReactNode;
}

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function BandwidthCalculator({ header }: BandwidthCalculatorProps) {
  const { state, result, actions } = useBandwidthCalculator();
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));

  return (
    <div className={classes.layout}>
      <Stack gap="md" className={classes.inputs}>
        {header}

        {state.cameraGroups.map((group) => {
          const usage = usageByGroupId.get(group.id);
          return (
            usage && (
              <BandwidthCameraGroupCard
                key={group.id}
                group={group}
                usage={usage}
                canDuplicate={!atGroupLimit}
                canDelete={groupCount > 1}
                actions={actions}
              />
            )
          );
        })}

        <Button
          variant="default"
          leftSection={<IconPlus size={16} />}
          onClick={actions.addGroup}
          disabled={atGroupLimit}
          className={classes.addGroup}
        >
          {atGroupLimit ? `Up to ${MAX_CAMERA_GROUPS} camera groups` : 'Add camera group'}
        </Button>

        <RecordingCard
          recordedStreams={state.recordedStreams}
          onChange={actions.setRecordedStreams}
        />
        <RemoteViewingCard
          remoteViewing={state.remoteViewing}
          viewedCamerasPerViewer={result.viewedCamerasPerViewer}
          onChange={actions.updateRemoteViewing}
        />
        <NetworkChecksCard network={state.network} onChange={actions.updateNetwork} />
        <OverheadCard overheadPercent={state.overheadPercent} onChange={actions.setOverhead} />
      </Stack>

      <div className={classes.results}>
        <ResultsPlaceholderCard result={result} />
      </div>
    </div>
  );
}
