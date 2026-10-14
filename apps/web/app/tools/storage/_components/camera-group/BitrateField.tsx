'use client';

import {
  BITRATE_INPUT_MAX_MBPS,
  BITRATE_INPUT_MIN_MBPS,
  isBitrateModelValidated,
  type BitrateSource,
  type CameraGroupUsage,
} from '@cctv/calc-core';
import { NumberInput, Text } from '@mantine/core';
import { FieldRow, fieldLabelId } from '../../../../../components/FieldRow/FieldRow';
import { OptionButtons } from '../../../../../components/OptionButtons/OptionButtons';
import { useNumberDraft } from '../../../../../hooks/use-number-draft';
import { describeEstimate } from '../../_lib/group-summary';
import { BITRATE_SOURCE_OPTIONS } from '../../_lib/storage-labels';
import type { CameraGroupState } from '../../_state/storage-calculator-state';
import classes from './CameraGroupCard.module.css';

const BITRATE_HELP = (
  <>
    Per-camera stream bitrate. <b>Estimate</b>: a typical value and likely range for early planning;
    real bitrate varies a lot with scene, night/IR and camera model. <b>Known average</b>: a
    measured average from an existing system. <b>Bitrate cap</b>: the CBR or maximum bitrate set on
    the camera, which gives a reliable worst case.
    {!isBitrateModelValidated &&
      ' The estimate currently uses preliminary placeholder values that have not been validated against real cameras.'}
  </>
);

const roundToTenth = (mbps: number) =>
  Math.min(BITRATE_INPUT_MAX_MBPS, Math.max(BITRATE_INPUT_MIN_MBPS, Math.round(mbps * 10) / 10));

interface BitrateFieldProps {
  idPrefix: string;
  group: CameraGroupState;
  usage: CameraGroupUsage;
  onSourceChange: (source: BitrateSource) => void;
  onMbpsChange: (mbps: number) => void;
}

/** Bitrate source selector plus the estimate text or an Mbps input. */
export function BitrateField({
  idPrefix,
  group,
  usage,
  onSourceChange,
  onMbpsChange,
}: BitrateFieldProps) {
  const sourceId = `${idPrefix}-bitrate-source`;

  return (
    <FieldRow label="Bitrate" help={BITRATE_HELP} controlId={sourceId}>
      <OptionButtons
        id={sourceId}
        value={group.bitrate.source}
        onChange={onSourceChange}
        options={BITRATE_SOURCE_OPTIONS}
        aria-labelledby={fieldLabelId(sourceId)}
      />
      {group.bitrate.source === 'estimate' ? (
        <Text size="sm" className={classes.estimate}>
          {describeEstimate(usage)}
        </Text>
      ) : (
        <EnteredBitrateInput
          id={`${idPrefix}-bitrate-mbps`}
          label={
            group.bitrate.source === 'bitrate-cap' ? 'Bitrate cap (Mbps)' : 'Known average (Mbps)'
          }
          value={group.bitrate.mbps}
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
