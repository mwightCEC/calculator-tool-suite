'use client';

import type { CableLengthUnit, PoeGroupUsage } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import type { CountNoun } from '../../../../components/CameraGroupCard/CameraGroupHeader';
import { formatWatts } from '../../../../lib/format';
import { summarizeGroup } from '../_lib/group-summary';
import type { PoeGroupState } from '../_state/poe-calculator-state';
import type { PoeCalculatorActions } from '../_state/use-poe-calculator';
import { DeviceFields } from './DeviceFields';

const DEVICES: CountNoun = { one: 'device', other: 'devices' };

interface PoeDeviceGroupCardProps {
  group: PoeGroupState;
  usage: PoeGroupUsage;
  cableLengthUnit: CableLengthUnit;
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: PoeCalculatorActions;
}

/** A PoE device group: the shared group card with the PoE fields. */
export function PoeDeviceGroupCard({
  group,
  usage,
  cableLengthUnit,
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  actions,
}: PoeDeviceGroupCardProps) {
  const id = group.id;
  const total = formatWatts(usage.totalWatts);

  return (
    <CameraGroupCard
      groupId={id}
      name={group.name}
      cameraCount={group.deviceCount}
      countNoun={DEVICES}
      colorIndex={group.colorIndex}
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
      canDuplicate={canDuplicate}
      canDelete={canDelete}
      onRename={(name) => actions.updateGroup(id, { name })}
      onDuplicate={() => actions.duplicateGroup(id)}
      onDelete={() => actions.removeGroup(id)}
      collapsedSummary={summarizeGroup(group, usage, cableLengthUnit)}
      collapsedValue={total}
      totalValue={total}
      variant="nested"
    >
      <DeviceFields
        group={group}
        usage={usage}
        cableLengthUnit={cableLengthUnit}
        onChange={(changes) => actions.updateGroup(id, changes)}
        onPowerInputChange={(input) => actions.setPowerInput(id, input)}
        onCableLengthUnitChange={actions.setCableLengthUnit}
      />
    </CameraGroupCard>
  );
}
