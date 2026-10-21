'use client';

import type { CameraGroupUsage } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../../components/CameraGroupCard/CameraGroupCard';
import { CameraStreamFields } from '../../../../../components/CameraGroupCard/CameraStreamFields';
import { formatGb, formatMbps } from '../../../../../lib/format';
import { summarizeGroup } from '../../_lib/group-summary';
import type { CameraGroupChanges, CameraGroupState } from '../../_state/storage-calculator-state';
import type { StorageCalculatorActions } from '../../_state/use-storage-calculator';
import { RecordingFields } from './RecordingFields';

interface StorageCameraGroupCardProps {
  group: CameraGroupState;
  usage: CameraGroupUsage;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: StorageCalculatorActions;
}

/** A Storage camera group: the shared card and stream fields, plus recording mode and GB per day. */
export function StorageCameraGroupCard({
  group,
  usage,
  canDuplicate,
  canDelete,
  actions,
}: StorageCameraGroupCardProps) {
  const id = group.id;
  const update = (changes: CameraGroupChanges) => actions.updateGroup(id, changes);
  // "~" marks values that come from the bitrate estimate.
  const approx = group.bitrate.source === 'estimate' ? '~' : '';
  const gbPerDay = `${approx}${formatGb(usage.gbPerDay.typical)}/day`;

  return (
    <CameraGroupCard
      groupId={id}
      name={group.name}
      cameraCount={group.cameraCount}
      colorIndex={group.colorIndex}
      canDuplicate={canDuplicate}
      canDelete={canDelete}
      onRename={(name) => update({ name })}
      onDuplicate={() => actions.duplicateGroup(id)}
      onDelete={() => actions.removeGroup(id)}
      collapsedSummary={summarizeGroup(group, usage)}
      collapsedValue={gbPerDay}
      totalValue={
        <>
          {approx}
          {formatMbps(usage.totalBitrateMbps.typical)} · {gbPerDay}
        </>
      }
    >
      <CameraStreamFields
        group={group}
        perCameraMbps={usage.bitratePerCameraMbps}
        onChange={update}
        onBitrateSourceChange={(source) => actions.setBitrateSource(id, source)}
      >
        <RecordingFields group={group} onChange={update} />
      </CameraStreamFields>
    </CameraGroupCard>
  );
}
