'use client';

import {
  BITRATE_INPUT_MAX_MBPS,
  BITRATE_INPUT_MIN_MBPS,
  BITRATE_SOURCES,
  estimateBitrateBreakdown,
  type BitrateGroupFields,
  type BitrateSource,
  type ValueRange,
} from '@cctv/calc-core';
import { NumberInput, SegmentedControl, Text } from '@mantine/core';
import { useNumberDraft } from '../../hooks/use-number-draft';
import { describeEstimateWorking } from '../../lib/bitrate-text';
import {
  BITRATE_SOURCE_OPTIONS,
  parseOption,
  SCENE_COMPLEXITY_LABELS,
} from '../../lib/camera-labels';
import classes from './CameraGroupCard.module.css';

const roundToTenth = (mbps: number) =>
  Math.min(BITRATE_INPUT_MAX_MBPS, Math.max(BITRATE_INPUT_MIN_MBPS, Math.round(mbps * 10) / 10));

interface BitrateFieldProps {
  idPrefix: string;
  group: BitrateGroupFields;
  /** Per-camera bitrate range, used to describe the estimate. */
  perCameraMbps: ValueRange;
  onSourceChange: (source: BitrateSource) => void;
  onMbpsChange: (mbps: number) => void;
}

/** "Bitrate per camera": an Estimated / Manual toggle, then the estimate's working or an Mbps input. */
export function BitrateField({
  idPrefix,
  group,
  perCameraMbps,
  onSourceChange,
  onMbpsChange,
}: BitrateFieldProps) {
  const titleId = `${idPrefix}-bitrate-title`;
  const { bitrate } = group;

  return (
    <div className={classes.bitrate}>
      <div className={classes.bitrateHeader}>
        <Text id={titleId} className={classes.bitrateTitle}>
          Bitrate per camera
        </Text>
        <SegmentedControl
          size="sm"
          value={bitrate.source}
          onChange={(value) => {
            const source = parseOption(BITRATE_SOURCES, value);
            if (source) {
              onSourceChange(source);
            }
          }}
          data={BITRATE_SOURCE_OPTIONS}
          aria-labelledby={titleId}
        />
      </div>
      {bitrate.source === 'estimate' ? (
        <EstimateWorkingText group={group} perCameraMbps={perCameraMbps} />
      ) : (
        <ConfiguredBitrate
          id={`${idPrefix}-bitrate-mbps`}
          value={bitrate.mbps}
          onChange={onMbpsChange}
        />
      )}
    </div>
  );
}

function EstimateWorkingText({
  group,
  perCameraMbps,
}: Pick<BitrateFieldProps, 'group' | 'perCameraMbps'>) {
  const working = describeEstimateWorking(estimateBitrateBreakdown(group), perCameraMbps);
  const scene = SCENE_COMPLEXITY_LABELS[group.sceneComplexity].toLowerCase();

  return (
    <Text size="sm" className={classes.secondaryText}>
      {working.stream} typical for this resolution, frame rate and codec × {working.multiplier} (
      {scene} scene) = <b className={classes.emphasis}>{working.typical}</b>, {working.likely}. Use
      Manual when the camera&apos;s real bitrate is known.
    </Text>
  );
}

function ConfiguredBitrate({ id, value, onChange }: Omit<EnteredBitrateInputProps, 'label'>) {
  const label = 'Configured bitrate';
  return (
    <div className={classes.configured}>
      <label htmlFor={id} className={classes.configuredLabel}>
        {label}
      </label>
      <Text size="sm" className={classes.secondaryText}>
        The bitrate set on the camera or recorder. Used as entered; scene complexity no longer
        applies.
      </Text>
      <EnteredBitrateInput id={id} label={label} value={value} onChange={onChange} />
    </div>
  );
}

export interface EnteredBitrateInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (mbps: number) => void;
}

/** A per-camera bitrate in Mbps (0.1–100), rounded to 0.1. Also used by Bandwidth's remote viewing. */
export function EnteredBitrateInput({ id, label, value, onChange }: EnteredBitrateInputProps) {
  const { draft, handleChange, handleBlur } = useNumberDraft({
    value,
    onChange,
    sanitize: roundToTenth,
  });

  return (
    <NumberInput
      id={id}
      aria-label={label}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      min={BITRATE_INPUT_MIN_MBPS}
      max={BITRATE_INPUT_MAX_MBPS}
      step={0.1}
      decimalScale={1}
      allowNegative={false}
      clampBehavior="none"
      rightSection="Mbps"
      rightSectionWidth={48}
      classNames={{ root: classes.mbpsInput, section: classes.unitSection }}
    />
  );
}
