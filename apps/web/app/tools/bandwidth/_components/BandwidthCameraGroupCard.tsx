'use client';

import { isSubStreamModelValidated, type BandwidthGroupUsage } from '@cctv/calc-core';
import { Text } from '@mantine/core';
import { CameraGroupCard } from '../../../../components/CameraGroupCard/CameraGroupCard';
import { CameraStreamFields } from '../../../../components/CameraGroupCard/CameraStreamFields';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { describeEstimate } from '../../../../lib/bitrate-text';
import { SUB_STREAM_RESOLUTION_OPTIONS } from '../_lib/bandwidth-labels';
import { describeGroupTotals, describeMainTotal, summarizeGroup } from '../_lib/group-summary';
import type {
  BandwidthGroupChanges,
  BandwidthGroupState,
} from '../_state/bandwidth-calculator-state';
import type { BandwidthCalculatorActions } from '../_state/use-bandwidth-calculator';
import classes from './BandwidthCalculator.module.css';

const SUB_STREAM_HELP = `Lower-resolution second stream each camera sends, used for grid views and sometimes recorded alongside the main stream.${
  isSubStreamModelValidated
    ? ''
    : ' Its bitrate uses preliminary placeholder values that have not been validated against real cameras.'
}`;

interface BandwidthCameraGroupCardProps {
  group: BandwidthGroupState;
  usage: BandwidthGroupUsage;
  expanded: boolean;
  onToggleExpanded: () => void;
  canDuplicate: boolean;
  canDelete: boolean;
  actions: BandwidthCalculatorActions;
}

/** A Bandwidth camera group: the shared card and stream fields, plus the sub-stream. */
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
  const subStreamId = `${id}-sub-stream`;

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
      collapsedValue={describeMainTotal(group, usage)}
      totalValue={describeGroupTotals(group, usage)}
    >
      <CameraStreamFields
        group={group}
        perCameraMbps={usage.mainPerCameraMbps}
        onChange={update}
        onBitrateSourceChange={(source) => actions.setBitrateSource(id, source)}
      >
        <FieldRow label="Sub-stream" help={SUB_STREAM_HELP} controlId={subStreamId}>
          <OptionButtons
            id={subStreamId}
            value={group.subStreamResolution}
            onChange={(subStreamResolution) => update({ subStreamResolution })}
            options={SUB_STREAM_RESOLUTION_OPTIONS}
            aria-labelledby={fieldLabelId(subStreamId)}
          />
          <Text size="sm" className={classes.secondaryText}>
            {describeEstimate(usage.subPerCameraMbps)}
            {isSubStreamModelValidated ? '' : ' (placeholder)'}
          </Text>
        </FieldRow>
      </CameraStreamFields>
    </CameraGroupCard>
  );
}
