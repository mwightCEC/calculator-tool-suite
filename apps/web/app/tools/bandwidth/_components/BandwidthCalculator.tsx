'use client';

import { Stack } from '@mantine/core';
import { CameraConfigurationCard } from '../../../../components/CameraGroupCard/CameraConfigurationCard';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeBandwidth } from '../_lib/result-summary';
import { useBandwidthCalculator } from '../_state/use-bandwidth-calculator';
import { BandwidthCameraGroupCard } from './BandwidthCameraGroupCard';
import { NetworkSection } from './NetworkSection';
import { PrintSummary } from './PrintSummary';
import { RemoteViewingSection } from './RemoteViewingSection';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import classes from './BandwidthCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function BandwidthCalculator() {
  const { state, result, hasCustomGroups, actions } = useBandwidthCalculator();
  const expansion = useGroupExpansion(state.cameraGroups.map((group) => group.id));
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const bandwidth = describeBandwidth(result);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          <CameraConfigurationCard
            groupCount={groupCount}
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

            <RemoteViewingSection
              remoteViewing={state.remoteViewing}
              viewedCamerasPerViewer={
                // Only shown while remote viewing is on, when the result has it.
                result.remoteViewing?.viewedCamerasPerViewer ?? state.remoteViewing.camerasPerViewer
              }
              averagePerCameraMbps={result.averagePerCameraMbps}
              onChange={actions.updateRemoteViewing}
            />
            <NetworkSection
              network={state.network}
              overheadPercent={state.overheadPercent}
              onNetworkChange={actions.updateNetwork}
              onOverheadChange={actions.setOverhead}
            />
          </CameraConfigurationCard>
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} />
        </div>

        <MobileResultBar
          label="Bandwidth estimate"
          value={bandwidth.value}
          detail={bandwidth.likelyRange}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
