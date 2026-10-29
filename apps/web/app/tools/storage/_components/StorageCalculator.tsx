'use client';

import { Stack } from '@mantine/core';
import { CameraConfigurationCard } from '../../../../components/CameraGroupCard/CameraConfigurationCard';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeHeadline } from '../_lib/result-summary';
import { useStorageCalculator } from '../_state/use-storage-calculator';
import { CalculationModeCards } from './CalculationModeCards';
import { StorageCameraGroupCard } from './camera-group/StorageCameraGroupCard';
import { PrintSummary } from './print/PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { StorageSettingsSection } from './StorageSettingsSection';
import classes from './StorageCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function StorageCalculator() {
  const { state, result, hasCustomGroups, actions } = useStorageCalculator();
  const expansion = useGroupExpansion(state.cameraGroups.map((group) => group.id));
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const headline = describeHeadline(result);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          <CalculationModeCards value={state.mode} onChange={actions.setMode} />

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
                  <StorageCameraGroupCard
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

            <StorageSettingsSection
              mode={state.mode}
              storage={state.storage}
              onChange={actions.updateStorage}
            />
          </CameraConfigurationCard>
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} />
        </div>

        <MobileResultBar
          label={headline.label}
          value={headline.value}
          detail={headline.likelyRange}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
