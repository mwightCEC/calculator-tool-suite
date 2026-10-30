'use client';

import { Stack } from '@mantine/core';
import { CameraConfigurationCard } from '../../../../components/CameraGroupCard/CameraConfigurationCard';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeWorstDeviceVolts, describeWorstDrop } from '../_lib/result-summary';
import { useVoltageDropCalculator } from '../_state/use-voltage-drop-calculator';
import { PrintSummary } from './PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { SupplySection } from './SupplySection';
import { VoltageDropGroupCard } from './VoltageDropGroupCard';
import classes from './VoltageDropCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function VoltageDropCalculator() {
  const { state, result, hasCustomGroups, actions } = useVoltageDropCalculator();
  const expansion = useGroupExpansion(state.deviceGroups.map((group) => group.id));
  const groupCount = state.deviceGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const drop = describeWorstDrop(state, result);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
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
                  <VoltageDropGroupCard
                    key={group.id}
                    group={group}
                    usage={usage}
                    wireSystem={state.wireSystem}
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

            <SupplySection
              powerSupply={state.powerSupply}
              dropLimitPercent={state.dropLimitPercent}
              onChange={actions.updateSupply}
              onDropLimitChange={actions.setDropLimit}
            />
          </CameraConfigurationCard>
        </Stack>

        <div className={classes.results}>
          <ResultsCard result={result} state={state} />
        </div>

        <MobileResultBar
          label="Worst voltage drop"
          value={drop.value}
          detail={describeWorstDeviceVolts(result)}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
