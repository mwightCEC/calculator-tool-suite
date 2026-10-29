'use client';

import type { CameraGroupUsage } from '@cctv/calc-core';
import { BitrateField } from '../../../../../components/CameraGroupCard/BitrateField';
import { CameraGroupCard } from '../../../../../components/CameraGroupCard/CameraGroupCard';
import {
  applyEnteredBitrate,
  CameraCountField,
  CodecField,
  FrameRateField,
  ResolutionField,
  SceneComplexityField,
} from '../../../../../components/CameraGroupCard/CameraStreamFields';
import { FieldLayoutProvider } from '../../../../../components/FieldRow/FieldRow';
import { formatGb, formatMbps } from '../../../../../lib/format';
import { summarizeGroup } from '../../_lib/group-summary';
import type { CameraGroupChanges, CameraGroupState } from '../../_state/storage-calculator-state';
import type { StorageCalculatorActions } from '../../_state/use-storage-calculator';
import { Disclosure } from '../Disclosure';
import { RecordingDetailField, RecordingModeField } from './RecordingFields';
import classes from './StorageGroupFields.module.css';

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

/**
 * The shared stream fields plus Storage's recording fields, in a grid with labels above.
 * Only Scene complexity keeps its info icon.
 * Bitrate sits under Advanced settings, open from the start when a known bitrate is set.
 */
function StorageGroupFields({ group, usage, actions }: StorageGroupProps) {
  const update = (changes: CameraGroupChanges) => actions.updateGroup(group.id, changes);
  return (
    <FieldLayoutProvider value="stacked">
      <div className={classes.grid}>
        <div className={classes.streamRow}>
          <CameraCountField group={group} onChange={update} withHelp={false} />
          <ResolutionField group={group} onChange={update} withHelp={false} />
          <FrameRateField group={group} onChange={update} withHelp={false} />
          <CodecField group={group} onChange={update} withHelp={false} />
        </div>
        <div className={classes.recordingRow}>
          <RecordingModeField group={group} onChange={update} />
          <SceneComplexityField
            group={group}
            onChange={update}
            helpNote="This is separate from how many hours are recorded."
            control="select"
          />
          <RecordingDetailField group={group} onChange={update} />
        </div>
      </div>
      <Disclosure
        title="Advanced settings"
        hint="(bitrate)"
        defaultOpened={group.bitrate.source !== 'estimate'}
      >
        <BitrateField
          idPrefix={group.id}
          bitrate={group.bitrate}
          perCameraMbps={usage.bitratePerCameraMbps}
          onSourceChange={(source) => actions.setBitrateSource(group.id, source)}
          onMbpsChange={(mbps) => applyEnteredBitrate(group, update, mbps)}
          withHelp={false}
        />
      </Disclosure>
    </FieldLayoutProvider>
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
