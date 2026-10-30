'use client';

import { Stack } from '@mantine/core';
import { CameraConfigurationCard } from '../../../../components/CameraGroupCard/CameraConfigurationCard';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeUsage } from '../_lib/result-summary';
import { usePoeCalculator } from '../_state/use-poe-calculator';
import { HowCalculated } from './HowCalculated';
import { PoeDeviceGroupCard } from './PoeDeviceGroupCard';
import { PrintSummary } from './PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { SwitchCard } from './SwitchCard';
import classes from './PoeCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function PoeCalculator() {
  const { state, result, hasCustomGroups, actions } = usePoeCalculator();
  const expansion = useGroupExpansion(state.deviceGroups.map((group) => group.id));
  const groupCount = state.deviceGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const usage = describeUsage(result);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          <SwitchCard powerSource={state.powerSource} onChange={actions.updateSwitch} />

          <CameraConfigurationCard
            noun="device"
            groupCount={groupCount}
            expansion={expansion}
            onAddGroup={actions.addGroup}
            canClear={hasCustomGroups}
            onClear={actions.clearGroups}
          >
            {state.deviceGroups.map((group) => {
              const usage = usageByGroupId.get(group.id);
              return (
                usage && (
                  <PoeDeviceGroupCard
                    key={group.id}
                    group={group}
                    usage={usage}
                    cableLengthUnit={state.cableLengthUnit}
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

          <HowCalculated />
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} />
        </div>

        <MobileResultBar
          label="PoE budget used"
          value={usage.value}
          detail={usage.detail}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
