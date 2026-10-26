'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Stack } from '@mantine/core';
import { CameraGroupToolbar } from '../../../../components/CameraGroupCard/CameraGroupToolbar';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { ModeSwitch } from '../../../../components/ModeSwitch/ModeSwitch';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { usePoeCalculator } from '../_state/use-poe-calculator';
import { BudgetSummary } from './BudgetSummary';
import { PoeDeviceGroupCard, PoeDevicesCard } from './PoeDeviceGroupCard';
import { SwitchCard } from './SwitchCard';
import classes from './PoeCalculator.module.css';

interface PoeCalculatorProps {
  /** Server-rendered page title and introduction. */
  header: ReactNode;
}

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function PoeCalculator({ header }: PoeCalculatorProps) {
  const { state, result, hasCustomGroups, actions } = usePoeCalculator();
  const expansion = useGroupExpansion(state.deviceGroups.map((group) => group.id));
  const groupCount = state.deviceGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const advanced = state.inputMode === 'advanced';
  const firstGroup = state.deviceGroups[0];
  const firstUsage = firstGroup && usageByGroupId.get(firstGroup.id);

  return (
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

        <SwitchCard
          powerSource={state.powerSource}
          showReserve={advanced}
          onChange={actions.updateSwitch}
        />

        {advanced ? (
          <>
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
            <PoeDevicesCard
              group={firstGroup}
              usage={firstUsage}
              cableLengthUnit={state.cableLengthUnit}
              actions={actions}
            />
          )
        )}
      </Stack>

      <div className={classes.results}>
        <BudgetSummary result={result} />
      </div>
    </div>
  );
}
