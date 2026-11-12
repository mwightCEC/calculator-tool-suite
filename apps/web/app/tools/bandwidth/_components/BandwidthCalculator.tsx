'use client';

import { Stack } from '@mantine/core';
import { CameraConfigurationCard } from '../../../../components/CameraGroupCard/CameraConfigurationCard';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { RestoredSessionBanner } from '../../../../components/RestoredSessionBanner/RestoredSessionBanner';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeBandwidth } from '../_lib/result-summary';
import { useBandwidthCalculator } from '../_state/use-bandwidth-calculator';
import { BandwidthCameraGroupCard } from './BandwidthCameraGroupCard';
import { OverheadSection } from './OverheadSection';
import { PrintSummary } from './PrintSummary';
import { RemoteViewingSection } from './RemoteViewingSection';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import classes from './BandwidthCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function BandwidthCalculator() {
  const { state, result, hasCustomGroups, actions, session } = useBandwidthCalculator();
  const expansion = useGroupExpansion(state.cameraGroups.map((group) => group.id));
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const bandwidth = describeBandwidth(result);

  return (
    <>
      <RestoredSessionBanner session={session} />
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          <OverheadSection overheadPercent={state.overheadPercent} onChange={actions.setOverhead} />

          <RemoteViewingSection
            remoteViewing={state.remoteViewing}
            viewedCamerasPerViewer={
              // The result only has it while remote viewing is on; the disabled fields show the entry.
              result.remoteViewing?.viewedCamerasPerViewer ?? state.remoteViewing.camerasPerViewer
            }
            averagePerCameraMbps={result.averagePerCameraMbps}
            onChange={actions.updateRemoteViewing}
          />

          <CameraConfigurationCard
            groupCount={groupCount}
            itemCount={result.totalCameras}
            expansion={expansion}
            onAddGroup={actions.addGroup}
            canClear={hasCustomGroups}
            onClear={actions.clearGroups}
          >
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
          </CameraConfigurationCard>
        </Stack>

        <div className={classes.results}>
          <ResultsCard
            result={result}
            state={state}
            onUplinkChange={(uplinkMbps) => actions.updateNetwork({ uplinkMbps })}
          />
        </div>

        <MobileResultBar
          label="Estimated bandwidth"
          value={bandwidth.value}
          detail={bandwidth.likelyRange}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
