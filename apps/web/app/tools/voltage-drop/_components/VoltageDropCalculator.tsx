'use client';

import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Stack } from '@mantine/core';
import { CameraGroupToolbar } from '../../../../components/CameraGroupCard/CameraGroupToolbar';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { ModeSwitch } from '../../../../components/ModeSwitch/ModeSwitch';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeWorstDeviceVolts, describeWorstDrop } from '../_lib/result-summary';
import { useVoltageDropCalculator } from '../_state/use-voltage-drop-calculator';
import { HowCalculated } from './HowCalculated';
import { PowerSupplyCard } from './PowerSupplyCard';
import { PrintSummary } from './PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { VoltageDropDevicesCard, VoltageDropGroupCard } from './VoltageDropGroupCard';
import classes from './VoltageDropCalculator.module.css';

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function VoltageDropCalculator() {
  const { state, result, hasCustomGroups, actions } = useVoltageDropCalculator();
  const expansion = useGroupExpansion(state.deviceGroups.map((group) => group.id));
  const groupCount = state.deviceGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const advanced = state.inputMode === 'advanced';
  const firstGroup = state.deviceGroups[0];
  const firstUsage = firstGroup && usageByGroupId.get(firstGroup.id);
  const drop = describeWorstDrop(state, result);
  const units = { wireSystem: state.wireSystem, cableLengthUnit: state.cableLengthUnit };

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
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

          <PowerSupplyCard
            powerSupply={state.powerSupply}
            dropLimitPercent={state.dropLimitPercent}
            advanced={advanced}
            onChange={actions.updateSupply}
            onDropLimitChange={actions.setDropLimit}
          />

          {advanced ? (
            <>
              {state.deviceGroups.map((group) => {
                const usage = usageByGroupId.get(group.id);
                return (
                  usage && (
                    <VoltageDropGroupCard
                      key={group.id}
                      group={group}
                      usage={usage}
                      {...units}
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
                {atGroupLimit ? `Up to ${MAX_CAMERA_GROUPS} device groups` : 'Add device group'}
              </Button>
            </>
          ) : (
            firstGroup &&
            firstUsage && (
              <VoltageDropDevicesCard
                group={firstGroup}
                usage={firstUsage}
                {...units}
                actions={actions}
              />
            )
          )}

          <HowCalculated />
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
