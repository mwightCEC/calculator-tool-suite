'use client';

import type { CableLengthUnit, PoeGroupUsage } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import type { CountNoun } from '../../../../components/CameraGroupCard/CameraGroupHeader';
import { CamerasCard } from '../../../../components/CameraGroupCard/CamerasCard';
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

/** An Advanced-mode device group: the shared group card with the PoE fields. */
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
    >
      <DeviceFields
        group={group}
        usage={usage}
        cableLengthUnit={cableLengthUnit}
        showCableLength
        onChange={(changes) => actions.updateGroup(id, changes)}
        onPowerInputChange={(input) => actions.setPowerInput(id, input)}
        onCableLengthUnitChange={actions.setCableLengthUnit}
      />
    </CameraGroupCard>
  );
}

interface PoeDevicesCardProps {
  group: PoeGroupState;
  usage: PoeGroupUsage;
  cableLengthUnit: CableLengthUnit;
  actions: PoeCalculatorActions;
}

/** Simple mode's single device setup; cable length stays at the 100 m assumption. */
export function PoeDevicesCard({ group, usage, cableLengthUnit, actions }: PoeDevicesCardProps) {
  return (
    <CamerasCard
      title="Devices"
      colorIndex={group.colorIndex}
      totalValue={formatWatts(usage.totalWatts)}
    >
      <DeviceFields
        group={group}
        usage={usage}
        cableLengthUnit={cableLengthUnit}
        showCableLength={false}
        onChange={(changes) => actions.updateGroup(group.id, changes)}
        onPowerInputChange={(input) => actions.setPowerInput(group.id, input)}
        onCableLengthUnitChange={actions.setCableLengthUnit}
      />
    </CamerasCard>
  );
}
