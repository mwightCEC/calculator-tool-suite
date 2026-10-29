'use client';

import type { CameraGroupUsage } from '@cctv/calc-core';
import { CameraGroupCard } from '../../../../../components/CameraGroupCard/CameraGroupCard';
import { CameraStreamGrid } from '../../../../../components/CameraGroupCard/CameraStreamGrid';
import { formatGb, formatMbps } from '../../../../../lib/format';
import { summarizeGroup } from '../../_lib/group-summary';
import type { CameraGroupChanges, CameraGroupState } from '../../_state/storage-calculator-state';
import type { StorageCalculatorActions } from '../../_state/use-storage-calculator';
import { RecordingDetailField, RecordingModeField } from './RecordingFields';

interface StorageGroupProps {
  group: CameraGroupState;
  usage: CameraGroupUsage;
  actions: StorageCalculatorActions;
}

/** "~" marks values that come from the bitrate estimate. */
function describeTotals({ group, usage }: Pick<StorageGroupProps, 'group' | 'usage'>) {
  const approx = group.bitrate.source === 'estimate' ? '~' : '';
  const gbPerDay = `${approx}${formatGb(usage.gbPerDay.typical)}/day`;
  return {
    gbPerDay,
    total: `${approx}${formatMbps(usage.totalBitrateMbps.typical)} · ${gbPerDay}`,
  };
}

/** The shared camera field grid with Storage's recording fields beside Scene complexity. */
function StorageGroupFields({ group, usage, actions }: StorageGroupProps) {
  const update = (changes: CameraGroupChanges) => actions.updateGroup(group.id, changes);
  return (
    <CameraStreamGrid
      group={group}
      perCameraMbps={usage.bitratePerCameraMbps}
      onChange={update}
      onBitrateSourceChange={(source) => actions.setBitrateSource(group.id, source)}
      sceneComplexityHelpNote="This is separate from how many hours are recorded."
      beforeSceneComplexity={<RecordingModeField group={group} onChange={update} />}
      afterSceneComplexity={<RecordingDetailField group={group} onChange={update} />}
    />
  );
}

interface StorageCameraGroupCardProps extends StorageGroupProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
}

/** A Storage camera group: the shared card with recording mode and GB per day. */
export function StorageCameraGroupCard({
  group,
  usage,
  expanded,
  onToggleExpanded,
  canDuplicate,
  canDelete,
  actions,
}: StorageCameraGroupCardProps) {
  const id = group.id;
  const { gbPerDay, total } = describeTotals({ group, usage });

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
      onRename={(name) => actions.updateGroup(id, { name })}
      onDuplicate={() => actions.duplicateGroup(id)}
      onDelete={() => actions.removeGroup(id)}
      collapsedSummary={summarizeGroup(group, usage)}
      collapsedValue={gbPerDay}
      totalValue={total}
      variant="nested"
    >
      <StorageGroupFields group={group} usage={usage} actions={actions} />
    </CameraGroupCard>
  );
}
