'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Stack } from '@mantine/core';
import { CameraGroupToolbar } from '../../../../components/CameraGroupCard/CameraGroupToolbar';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { ModeSwitch } from '../../../../components/ModeSwitch/ModeSwitch';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeIngest } from '../_lib/result-summary';
import { useBandwidthCalculator } from '../_state/use-bandwidth-calculator';
import { BandwidthCameraGroupCard, BandwidthCamerasCard } from './BandwidthCameraGroupCard';
import { HowCalculated } from './HowCalculated';
import { NetworkChecksCard } from './NetworkChecksCard';
import { OverheadCard } from './OverheadCard';
import { PrintSummary } from './PrintSummary';
import { RecordingCard } from './RecordingCard';
import { RemoteViewingCard } from './RemoteViewingCard';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { SimpleRemoteViewingCard } from './SimpleRemoteViewingCard';
import classes from './BandwidthCalculator.module.css';

interface BandwidthCalculatorProps {
  /** Server-rendered page title and introduction. */
  header: ReactNode;
}

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function BandwidthCalculator({ header }: BandwidthCalculatorProps) {
  const { state, result, hasCustomGroups, actions } = useBandwidthCalculator();
  const expansion = useGroupExpansion(state.cameraGroups.map((group) => group.id));
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const ingest = describeIngest(result);
  const advanced = state.inputMode === 'advanced';
  const firstGroup = state.cameraGroups[0];
  const firstUsage = firstGroup && usageByGroupId.get(firstGroup.id);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          {header}

          <Group justify="space-between" gap="sm">
            <ModeSwitch value={state.inputMode} onChange={actions.setInputMode} />
            {advanced && (
              <CameraGroupToolbar
                allCollapsed={expansion.allCollapsed}
                onToggleAll={expansion.toggleAll}
                canClear={hasCustomGroups}
                onClear={() => {
                  actions.clearGroups();
                  expansion.expandAll();
                }}
              />
            )}
          </Group>

          {advanced ? (
            <>
              {state.cameraGroups.map((group) => {
                const usage = usageByGroupId.get(group.id);
                return (
                  usage && (
                    <BandwidthCameraGroupCard
                      key={group.id}
                      group={group}
                      usage={usage}
                      expanded={expansion.isExpanded(group.id)}
                      onToggleExpanded={() => expansion.toggle(group.id)}
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
              <OverheadCard
                overheadPercent={state.overheadPercent}
                onChange={actions.setOverhead}
              />
            </>
          ) : (
            <>
              {firstGroup && firstUsage && (
                <BandwidthCamerasCard group={firstGroup} usage={firstUsage} actions={actions} />
              )}
              <SimpleRemoteViewingCard
                viewers={state.remoteViewing.viewers}
                siteUploadMbps={state.network.siteUploadMbps}
                onRemoteViewingChange={actions.updateRemoteViewing}
                onNetworkChange={actions.updateNetwork}
              />
            </>
          )}

          <HowCalculated />
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} />
        </div>

        <MobileResultBar
          label="Bandwidth estimate"
          value={ingest.value}
          detail={ingest.likelyRange}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
