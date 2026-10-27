'use client';

import type { ReactNode } from 'react';
import {
  CODECS,
  FRAME_RATES,
  MAX_CAMERAS_PER_GROUP,
  RESOLUTIONS,
  type BitrateGroupFields,
  type BitrateSource,
  type ValueRange,
} from '@cctv/calc-core';
import { Select } from '@mantine/core';
import {
  CODEC_SELECT_DATA,
  FRAME_RATE_SELECT_DATA,
  parseOption,
  RESOLUTION_SELECT_DATA,
  SCENE_COMPLEXITY_OPTIONS,
} from '../../lib/camera-labels';
import { FieldRow, fieldLabelId } from '../FieldRow/FieldRow';
import { NumberStepper } from '../NumberStepper/NumberStepper';
import { OptionButtons } from '../OptionButtons/OptionButtons';
import { BitrateField } from './BitrateField';
import classes from './CameraGroupCard.module.css';

const SCENE_COMPLEXITY_HELP =
  'How much detail and movement the scene has, which affects how well it compresses. Busy scenes such as traffic, foliage or crowds need more bitrate.';

/** The camera group fields every calculator shares. */
export interface CameraStreamGroup extends BitrateGroupFields {
  id: string;
  cameraCount: number;
}

export type CameraStreamChanges = Partial<Omit<CameraStreamGroup, 'id'>>;

interface CameraStreamFieldsProps {
  group: CameraStreamGroup;
  /** Per-camera main-stream bitrate range, used to describe the estimate. */
  perCameraMbps: ValueRange;
  onChange: (changes: CameraStreamChanges) => void;
  onBitrateSourceChange: (source: BitrateSource) => void;
  /** Sentence added to the scene complexity help, e.g. to set it apart from a calculator's own fields. */
  sceneComplexityHelpNote?: string;
  /** Calculator-specific rows, placed between scene complexity and bitrate. */
  children?: ReactNode;
}

/** Cameras, main-stream settings and bitrate: one field per row. */
export function CameraStreamFields({
  group,
  perCameraMbps,
  onChange,
  onBitrateSourceChange,
  sceneComplexityHelpNote,
  children,
}: CameraStreamFieldsProps) {
  const id = group.id;
  const usesEstimate = group.bitrate.source === 'estimate';

  return (
    <>
      <FieldRow
        label="Cameras"
        help="Number of cameras in this group. All cameras in a group share the settings below."
        controlId={`${id}-cameras`}
      >
        <NumberStepper
          id={`${id}-cameras`}
          value={group.cameraCount}
          onChange={(cameraCount) => onChange({ cameraCount })}
          min={1}
          max={MAX_CAMERAS_PER_GROUP}
          unitLabel="camera"
        />
      </FieldRow>

      <FieldRow
        label="Resolution"
        help="Main-stream resolution. Higher resolutions need more bitrate."
        controlId={`${id}-resolution`}
      >
        <Select
          id={`${id}-resolution`}
          data={RESOLUTION_SELECT_DATA}
          value={group.resolution}
          onChange={(value) => {
            const resolution = parseOption(RESOLUTIONS, value);
            if (resolution) {
              onChange({ resolution });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow
        label="Codec"
        help="Video compression. H.265 usually needs less bitrate than H.264 for similar quality."
        controlId={`${id}-codec`}
      >
        <Select
          id={`${id}-codec`}
          data={CODEC_SELECT_DATA}
          value={group.codec}
          onChange={(value) => {
            const codec = parseOption(CODECS, value);
            if (codec) {
              onChange({ codec });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow
        label="Frame rate"
        help="Frames per second the camera sends. Lower frame rates reduce bitrate, though not proportionally."
        controlId={`${id}-fps`}
      >
        <Select
          id={`${id}-fps`}
          data={FRAME_RATE_SELECT_DATA}
          value={String(group.frameRate)}
          onChange={(value) => {
            const frameRate = parseOption(FRAME_RATES, value);
            if (frameRate !== undefined) {
              onChange({ frameRate });
            }
          }}
          allowDeselect={false}
          className={classes.selectNarrow}
        />
      </FieldRow>

      <FieldRow
        label="Scene complexity"
        help={[SCENE_COMPLEXITY_HELP, sceneComplexityHelpNote].filter(Boolean).join(' ')}
        controlId={`${id}-complexity`}
        dimmed={!usesEstimate}
        note={usesEstimate ? undefined : 'Not used with a known bitrate'}
      >
        <OptionButtons
          id={`${id}-complexity`}
          value={group.sceneComplexity}
          onChange={(sceneComplexity) => onChange({ sceneComplexity })}
          options={SCENE_COMPLEXITY_OPTIONS}
          aria-labelledby={fieldLabelId(`${id}-complexity`)}
        />
      </FieldRow>

      {children}

      <BitrateField
        idPrefix={id}
        bitrate={group.bitrate}
        perCameraMbps={perCameraMbps}
        onSourceChange={onBitrateSourceChange}
        onMbpsChange={(mbps) => {
          if (group.bitrate.source !== 'estimate') {
            onChange({ bitrate: { source: group.bitrate.source, mbps } });
          }
        }}
      />
    </>
  );
}
