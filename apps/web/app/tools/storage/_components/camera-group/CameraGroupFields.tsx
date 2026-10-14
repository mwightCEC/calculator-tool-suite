'use client';

import {
  CODECS,
  FRAME_RATES,
  MAX_CAMERAS_PER_GROUP,
  MOTION_PERCENT_MAX,
  MOTION_PERCENT_MIN,
  MOTION_PERCENT_STEP,
  SCHEDULE_HOURS_MAX,
  SCHEDULE_HOURS_MIN,
  RESOLUTIONS,
  type CameraGroupUsage,
} from '@cctv/calc-core';
import { Group, NumberInput, Select, Slider, Text } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../../components/OptionButtons/OptionButtons';
import { useNumberDraft } from '../../../../../hooks/use-number-draft';
import {
  CODEC_SELECT_DATA,
  FRAME_RATE_SELECT_DATA,
  parseOption,
  RECORDING_MODE_OPTIONS,
  RESOLUTION_SELECT_DATA,
  SCENE_COMPLEXITY_OPTIONS,
} from '../../_lib/storage-labels';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import type { StorageCalculatorActions } from '../../_state/use-storage-calculator';
import { BitrateField } from './BitrateField';
import classes from './CameraGroupCard.module.css';

interface CameraGroupFieldsProps {
  group: CameraGroupState;
  usage: CameraGroupUsage;
  actions: StorageCalculatorActions;
}

/** The expanded body of a camera group card: one field per row. */
export function CameraGroupFields({ group, usage, actions }: CameraGroupFieldsProps) {
  const id = group.id;
  const update = (changes: Parameters<StorageCalculatorActions['updateGroup']>[1]) =>
    actions.updateGroup(id, changes);
  const usesEstimate = group.bitrate.source === 'estimate';

  return (
    <div className={classes.fields}>
      <FieldRow
        label="Cameras"
        help="Number of cameras in this group. All cameras in a group share the settings below."
        controlId={`${id}-cameras`}
      >
        <NumberStepper
          id={`${id}-cameras`}
          value={group.cameraCount}
          onChange={(cameraCount) => update({ cameraCount })}
          min={1}
          max={MAX_CAMERAS_PER_GROUP}
          unitLabel="camera"
        />
      </FieldRow>

      <FieldRow
        label="Resolution"
        help="Main-stream recording resolution. Higher resolutions need more bitrate."
        controlId={`${id}-resolution`}
      >
        <Select
          id={`${id}-resolution`}
          data={RESOLUTION_SELECT_DATA}
          value={group.resolution}
          onChange={(value) => {
            const resolution = parseOption(RESOLUTIONS, value);
            if (resolution) {
              update({ resolution });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow
        label="Codec"
        help="Video compression. H.265 usually needs less bitrate than H.264 for similar quality. “Smart” means vendor smart-codec modes such as H.265+, which can lower bitrate further on quiet scenes."
        controlId={`${id}-codec`}
      >
        <Select
          id={`${id}-codec`}
          data={CODEC_SELECT_DATA}
          value={group.codec}
          onChange={(value) => {
            const codec = parseOption(CODECS, value);
            if (codec) {
              update({ codec });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow
        label="Frame rate"
        help="Recorded frames per second. Lower frame rates reduce bitrate, though not proportionally."
        controlId={`${id}-fps`}
      >
        <Select
          id={`${id}-fps`}
          data={FRAME_RATE_SELECT_DATA}
          value={String(group.frameRate)}
          onChange={(value) => {
            const frameRate = parseOption(FRAME_RATES, value);
            if (frameRate !== undefined) {
              update({ frameRate });
            }
          }}
          allowDeselect={false}
          className={classes.selectNarrow}
        />
      </FieldRow>

      <FieldRow
        label="Scene complexity"
        help="How much detail and movement the scene has, which affects how well it compresses. Busy scenes such as traffic, foliage or crowds need more bitrate. This is separate from how many hours are recorded."
        controlId={`${id}-complexity`}
        dimmed={!usesEstimate}
        note={usesEstimate ? undefined : 'Not used with a known bitrate'}
      >
        <OptionButtons
          id={`${id}-complexity`}
          value={group.sceneComplexity}
          onChange={(sceneComplexity) => update({ sceneComplexity })}
          options={SCENE_COMPLEXITY_OPTIONS}
          aria-labelledby={fieldLabelId(`${id}-complexity`)}
        />
      </FieldRow>

      <FieldRow
        label="Recording mode"
        help="How many hours per day are written to disk: all day, only when there is motion, or on a schedule."
        controlId={`${id}-recording`}
      >
        <OptionButtons
          id={`${id}-recording`}
          value={group.recordingMode}
          onChange={(recordingMode) => update({ recordingMode })}
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
              onChange={(motionPercent) => update({ motionPercent })}
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
            onChange={(scheduleHours) => update({ scheduleHours })}
          />
        </FieldRow>
      )}

      <BitrateField
        idPrefix={id}
        group={group}
        usage={usage}
        onSourceChange={(source) => actions.setBitrateSource(id, source)}
        onMbpsChange={(mbps) => {
          if (group.bitrate.source !== 'estimate') {
            update({ bitrate: { source: group.bitrate.source, mbps } });
          }
        }}
      />
    </div>
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
