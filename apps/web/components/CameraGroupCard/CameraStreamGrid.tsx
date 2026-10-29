'use client';

import type { ReactNode } from 'react';
import type { BitrateSource, ValueRange } from '@cctv/calc-core';
import { Disclosure } from '../Disclosure/Disclosure';
import { FieldLayoutProvider } from '../FieldRow/FieldRow';
import { BitrateField } from './BitrateField';
import {
  applyEnteredBitrate,
  CameraCountField,
  CodecField,
  FrameRateField,
  ResolutionField,
  SceneComplexityField,
  type CameraStreamChanges,
  type CameraStreamGroup,
} from './CameraStreamFields';
import classes from './CameraStreamGrid.module.css';

interface CameraStreamGridProps {
  group: CameraStreamGroup;
  /** Per-camera main-stream bitrate range, used to describe the estimate. */
  perCameraMbps: ValueRange;
  onChange: (changes: CameraStreamChanges) => void;
  onBitrateSourceChange: (source: BitrateSource) => void;
  /** Sentence added to the scene complexity help. */
  sceneComplexityHelpNote?: string;
  /** Calculator fields placed before Scene complexity in the second row. */
  beforeSceneComplexity?: ReactNode;
  /** Calculator fields placed after Scene complexity in the second row. */
  afterSceneComplexity?: ReactNode;
}

/**
 * A camera group's fields in a grid with labels above: cameras and main-stream
 * settings, then Scene complexity (the only info icon) and any calculator
 * fields, with the bitrate under Advanced settings. Advanced settings starts
 * open when a known bitrate is set.
 */
export function CameraStreamGrid({
  group,
  perCameraMbps,
  onChange,
  onBitrateSourceChange,
  sceneComplexityHelpNote,
  beforeSceneComplexity,
  afterSceneComplexity,
}: CameraStreamGridProps) {
  return (
    <FieldLayoutProvider value="stacked">
      <div className={classes.grid}>
        <div className={classes.streamRow}>
          <CameraCountField group={group} onChange={onChange} withHelp={false} />
          <ResolutionField group={group} onChange={onChange} withHelp={false} />
          <FrameRateField group={group} onChange={onChange} withHelp={false} />
          <CodecField group={group} onChange={onChange} withHelp={false} />
        </div>
        <div className={classes.detailRow}>
          {beforeSceneComplexity}
          <SceneComplexityField
            group={group}
            onChange={onChange}
            helpNote={sceneComplexityHelpNote}
            control="select"
          />
          {afterSceneComplexity}
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
          perCameraMbps={perCameraMbps}
          onSourceChange={onBitrateSourceChange}
          onMbpsChange={(mbps) => applyEnteredBitrate(group, onChange, mbps)}
          withHelp={false}
        />
      </Disclosure>
    </FieldLayoutProvider>
  );
}
