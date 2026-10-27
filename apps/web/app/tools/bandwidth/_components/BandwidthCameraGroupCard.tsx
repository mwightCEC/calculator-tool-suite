'use client';

import type { BandwidthGroupUsage } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import { CamerasCard } from '../../../../components/CameraGroupCard/CamerasCard';
import { CameraStreamFields } from '../../../../components/CameraGroupCard/CameraStreamFields';
import { describeGroupTotal, summarizeGroup } from '../_lib/group-summary';
import type {
  BandwidthGroupChanges,
  BandwidthGroupState,
} from '../_state/bandwidth-calculator-state';
import type { BandwidthCalculatorActions } from '../_state/use-bandwidth-calculator';

interface BandwidthCameraGroupCardProps {
  group: BandwidthGroupState;
  usage: BandwidthGroupUsage;
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: BandwidthCalculatorActions;
}

/** An Advanced-mode Bandwidth camera group: the shared card and stream fields. */
export function BandwidthCameraGroupCard({
  group,
  usage,
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  actions,
}: BandwidthCameraGroupCardProps) {
  const id = group.id;
  const update = (changes: BandwidthGroupChanges) => actions.updateGroup(id, changes);
  const total = describeGroupTotal(group, usage);

  return (
    <CameraGroupCard
      groupId={id}
      name={group.name}
      cameraCount={group.cameraCount}
      colorIndex={group.colorIndex}
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
      canDuplicate={canDuplicate}
      canDelete={canDelete}
      onRename={(name) => update({ name })}
      onDuplicate={() => actions.duplicateGroup(id)}
      onDelete={() => actions.removeGroup(id)}
      collapsedSummary={summarizeGroup(group, usage)}
      collapsedValue={total}
      totalValue={total}
    >
      <CameraStreamFields
        group={group}
        perCameraMbps={usage.perCameraMbps}
        onChange={update}
        onBitrateSourceChange={(source) => actions.setBitrateSource(id, source)}
      />
    </CameraGroupCard>
  );
}

interface BandwidthCamerasCardProps {
  group: BandwidthGroupState;
  usage: BandwidthGroupUsage;
  actions: BandwidthCalculatorActions;
}

/** Simple mode's single camera setup: the stream fields. */
export function BandwidthCamerasCard({ group, usage, actions }: BandwidthCamerasCardProps) {
  return (
    <CamerasCard colorIndex={group.colorIndex} totalValue={describeGroupTotal(group, usage)}>
      <CameraStreamFields
        group={group}
        perCameraMbps={usage.perCameraMbps}
        onChange={(changes) => actions.updateGroup(group.id, changes)}
        onBitrateSourceChange={(source) => actions.setBitrateSource(group.id, source)}
      />
    </CamerasCard>
  );
}
