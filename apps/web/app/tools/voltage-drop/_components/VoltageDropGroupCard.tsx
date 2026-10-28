'use client';

import type { CableLengthUnit, VoltageDropGroupUsage, WireSystem } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import type { CountNoun } from '../../../../components/CameraGroupCard/CameraGroupHeader';
import { CamerasCard } from '../../../../components/CameraGroupCard/CamerasCard';
import { formatAmps } from '../../../../lib/format';
import { summarizeGroup } from '../_lib/group-summary';
import type { VoltageDropCalculatorActions } from '../_state/use-voltage-drop-calculator';
import type { VoltageDropGroupState } from '../_state/voltage-drop-calculator-state';
import { LoadFields } from './LoadFields';

const DEVICES: CountNoun = { one: 'device', other: 'devices' };

interface SharedProps {
  group: VoltageDropGroupState;
  usage: VoltageDropGroupUsage;
  wireSystem: WireSystem;
  cableLengthUnit: CableLengthUnit;
  actions: VoltageDropCalculatorActions;
}

function GroupFields({ group, usage, wireSystem, cableLengthUnit, actions }: SharedProps) {
  return (
    <LoadFields
      group={group}
      usage={usage}
      wireSystem={wireSystem}
      cableLengthUnit={cableLengthUnit}
      onChange={(changes) => actions.updateGroup(group.id, changes)}
      onLoadInputChange={(input) => actions.setLoadInput(group.id, input)}
      onWireSystemChange={actions.setWireSystem}
      onCableLengthUnitChange={actions.setCableLengthUnit}
    />
  );
}

interface VoltageDropGroupCardProps extends SharedProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
}

/** An Advanced-mode device group: the shared group card with the voltage drop fields. */
export function VoltageDropGroupCard({
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  ...shared
}: VoltageDropGroupCardProps) {
  const { group, usage, cableLengthUnit, actions } = shared;
  const id = group.id;
  const total = formatAmps(usage.totalAmps);

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
      collapsedSummary={summarizeGroup(group, cableLengthUnit)}
      collapsedValue={total}
      totalValue={total}
    >
      <GroupFields {...shared} />
    </CameraGroupCard>
  );
}

/** Simple mode's single device setup. */
export function VoltageDropDevicesCard(props: SharedProps) {
  return (
    <CamerasCard
      title="Devices"
      colorIndex={props.group.colorIndex}
      totalValue={formatAmps(props.usage.totalAmps)}
    >
      <GroupFields {...props} />
    </CamerasCard>
  );
}
