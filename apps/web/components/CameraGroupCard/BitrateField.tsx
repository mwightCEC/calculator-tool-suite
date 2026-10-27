'use client';

import {
  BITRATE_INPUT_MAX_MBPS,
  BITRATE_INPUT_MIN_MBPS,
  isBitrateModelValidated,
  type BitrateSource,
  type GroupBitrate,
  type ValueRange,
} from '@cctv/calc-core';
import { NumberInput, Text } from '@mantine/core';
import { useNumberDraft } from '../../hooks/use-number-draft';
import { describeEstimate } from '../../lib/bitrate-text';
import { BITRATE_SOURCE_OPTIONS } from '../../lib/camera-labels';
import { FieldRow, fieldLabelId } from '../FieldRow/FieldRow';
import { OptionButtons } from '../OptionButtons/OptionButtons';
import classes from './CameraGroupCard.module.css';

const BITRATE_HELP = (
  <>
    Per-camera stream bitrate. <b>Estimate</b>: a typical value and likely range for early planning;
    real bitrate varies a lot with scene, night/IR and camera model. <b>VBR</b>: the measured
    average of a variable-bitrate stream, for example from an existing system. <b>CBR</b>: the
    constant or maximum bitrate set on the camera, which gives a reliable worst case.
    {!isBitrateModelValidated &&
      ' The estimate currently uses preliminary placeholder values that have not been validated against real cameras.'}
  </>
);

const roundToTenth = (mbps: number) =>
  Math.min(BITRATE_INPUT_MAX_MBPS, Math.max(BITRATE_INPUT_MIN_MBPS, Math.round(mbps * 10) / 10));

interface BitrateFieldProps {
  idPrefix: string;
  bitrate: GroupBitrate;
  /** Per-camera bitrate range, used to describe the estimate. */
  perCameraMbps: ValueRange;
  onSourceChange: (source: BitrateSource) => void;
  onMbpsChange: (mbps: number) => void;
}

/** Bitrate source selector plus the estimate text or an Mbps input. */
export function BitrateField({
  idPrefix,
  bitrate,
  perCameraMbps,
  onSourceChange,
  onMbpsChange,
}: BitrateFieldProps) {
  const sourceId = `${idPrefix}-bitrate-source`;

  return (
    <FieldRow label="Bitrate" help={BITRATE_HELP} controlId={sourceId}>
      <OptionButtons
        id={sourceId}
        value={bitrate.source}
        onChange={onSourceChange}
        options={BITRATE_SOURCE_OPTIONS}
        aria-labelledby={fieldLabelId(sourceId)}
      />
      {bitrate.source === 'estimate' ? (
        <Text size="sm" className={classes.estimate}>
          {describeEstimate(perCameraMbps)}
        </Text>
      ) : (
        <EnteredBitrateInput
          id={`${idPrefix}-bitrate-mbps`}
          label={bitrate.source === 'bitrate-cap' ? 'CBR bitrate (Mbps)' : 'VBR average (Mbps)'}
          value={bitrate.mbps}
          onChange={onMbpsChange}
        />
      )}
    </FieldRow>
  );
}

interface EnteredBitrateInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (mbps: number) => void;
}

function EnteredBitrateInput({ id, label, value, onChange }: EnteredBitrateInputProps) {
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
      classNames={{ input: classes.mbpsInput, section: classes.unitSection }}
    />
  );
}
