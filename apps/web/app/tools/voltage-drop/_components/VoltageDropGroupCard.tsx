'use client';

import type { CableLengthUnit, VoltageDropGroupUsage, WireSystem } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import type { CountNoun } from '../../../../components/CameraGroupCard/CameraGroupHeader';
import { formatAmps } from '../../../../lib/format';
import { summarizeGroup } from '../_lib/group-summary';
import type { VoltageDropCalculatorActions } from '../_state/use-voltage-drop-calculator';
import type { VoltageDropGroupState } from '../_state/voltage-drop-calculator-state';
import { LoadFields } from './LoadFields';

const DEVICES: CountNoun = { one: 'device', other: 'devices' };

interface VoltageDropGroupCardProps {
  group: VoltageDropGroupState;
  usage: VoltageDropGroupUsage;
  wireSystem: WireSystem;
  cableLengthUnit: CableLengthUnit;
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: VoltageDropCalculatorActions;
}

/** A device group: the shared group card with the voltage drop fields. */
export function VoltageDropGroupCard({
  group,
  usage,
  wireSystem,
  cableLengthUnit,
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  actions,
}: VoltageDropGroupCardProps) {
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
      variant="nested"
    >
      <LoadFields
        group={group}
        usage={usage}
        wireSystem={wireSystem}
        cableLengthUnit={cableLengthUnit}
        onChange={(changes) => actions.updateGroup(id, changes)}
        onLoadInputChange={(input) => actions.setLoadInput(id, input)}
        onWireSystemChange={actions.setWireSystem}
        onCableLengthUnitChange={actions.setCableLengthUnit}
      />
    </CameraGroupCard>
  );
}
