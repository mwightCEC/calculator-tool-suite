'use client';

import {
  MOTION_PERCENT_MAX,
  MOTION_PERCENT_MIN,
  MOTION_PERCENT_STEP,
  SCHEDULE_HOURS_MAX,
  SCHEDULE_HOURS_MIN,
} from '@cctv/calc-core';
import { Group, NumberInput, Slider, Text } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../../components/OptionButtons/OptionButtons';
import { useNumberDraft } from '../../../../../hooks/use-number-draft';
import { RECORDING_MODE_OPTIONS } from '../../_lib/storage-labels';
import type { CameraGroupChanges, CameraGroupState } from '../../_state/storage-calculator-state';
import classes from './RecordingFields.module.css';

interface RecordingFieldsProps {
  group: CameraGroupState;
  onChange: (changes: CameraGroupChanges) => void;
}

/** Recording mode, plus motion time or scheduled hours when they apply. */
export function RecordingFields({ group, onChange }: RecordingFieldsProps) {
  const id = group.id;

  return (
    <>
      <FieldRow
        label="Recording mode"
        help="How many hours per day are written to disk: all day, only when there is motion, or on a schedule."
        controlId={`${id}-recording`}
      >
        <OptionButtons
          id={`${id}-recording`}
          value={group.recordingMode}
          onChange={(recordingMode) => onChange({ recordingMode })}
          options={RECORDING_MODE_OPTIONS}
          aria-labelledby={fieldLabelId(`${id}-recording`)}
        />
      </FieldRow>

      {group.recordingMode === 'motion' && (
        <FieldRow
          label="Motion time"
          help="Estimated share of the day with motion, including pre- and post-event recording buffers."
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
        <FieldRow
          label="Hours per day"
          help="Hours recorded each day by the schedule."
          controlId={`${id}-hours`}
        >
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
