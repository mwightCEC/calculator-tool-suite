'use client';

import {
  MOTION_PERCENT_MAX,
  MOTION_PERCENT_MIN,
  MOTION_PERCENT_STEP,
  RECORDING_MODES,
  SCHEDULE_HOURS_MAX,
  SCHEDULE_HOURS_MIN,
} from '@cctv/calc-core';
import { Group, NumberInput, Select, Slider, Text } from '@mantine/core';
import { FieldRow } from '../../../../../components/FieldRow/FieldRow';
import { useNumberDraft } from '../../../../../hooks/use-number-draft';
import { parseOption } from '../../../../../lib/camera-labels';
import { RECORDING_MODE_OPTIONS } from '../../_lib/storage-labels';
import type { CameraGroupChanges, CameraGroupState } from '../../_state/storage-calculator-state';
import classes from './RecordingFields.module.css';

interface RecordingFieldsProps {
  group: CameraGroupState;
  onChange: (changes: CameraGroupChanges) => void;
}

export function RecordingModeField({ group, onChange }: RecordingFieldsProps) {
  return (
    <FieldRow label="Recording mode" controlId={`${group.id}-recording`}>
      <Select
        id={`${group.id}-recording`}
        data={RECORDING_MODE_OPTIONS}
        value={group.recordingMode}
        onChange={(value) => {
          const recordingMode = parseOption(RECORDING_MODES, value);
          if (recordingMode) {
            onChange({ recordingMode });
          }
        }}
        allowDeselect={false}
      />
    </FieldRow>
  );
}

/** Motion time or scheduled hours, when the recording mode uses them. */
export function RecordingDetailField({ group, onChange }: RecordingFieldsProps) {
  const id = group.id;

  return (
    <>
      {group.recordingMode === 'motion' && (
        <FieldRow
          label="Motion time"
          note="Include pre- and post-event recording."
          controlId={`${id}-motion`}
        >
          <Group gap="md" wrap="nowrap">
            <Slider
              id={`${id}-motion`}
              value={group.motionPercent}
              onChange={(motionPercent) => onChange({ motionPercent })}
              min={MOTION_PERCENT_MIN}
              max={MOTION_PERCENT_MAX}
              step={MOTION_PERCENT_STEP}
              label={(value) => `${value}%`}
              thumbLabel="Motion time, percent of day"
              className={classes.slider}
            />
            <Text size="sm" className={classes.sliderValue}>
              {group.motionPercent}% of day
            </Text>
          </Group>
        </FieldRow>
      )}

      {group.recordingMode === 'schedule' && (
        <FieldRow label="Hours per day" controlId={`${id}-hours`}>
          <ScheduleHoursInput
            id={`${id}-hours`}
            value={group.scheduleHours}
            onChange={(scheduleHours) => onChange({ scheduleHours })}
          />
        </FieldRow>
      )}
    </>
  );
}

const clampHours = (hours: number) =>
  Math.min(SCHEDULE_HOURS_MAX, Math.max(SCHEDULE_HOURS_MIN, Math.round(hours)));

function ScheduleHoursInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (hours: number) => void;
}) {
  const { draft, handleChange, handleBlur } = useNumberDraft({
    value,
    onChange,
    sanitize: clampHours,
  });
  return (
    <NumberInput
      id={id}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      min={SCHEDULE_HOURS_MIN}
      max={SCHEDULE_HOURS_MAX}
      allowDecimal={false}
      allowNegative={false}
      clampBehavior="none"
      className={classes.hoursInput}
    />
  );
}
