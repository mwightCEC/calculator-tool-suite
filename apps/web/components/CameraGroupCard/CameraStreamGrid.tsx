'use client';

import type { ReactNode } from 'react';
import type { BitrateSource, ValueRange } from '@cctv/calc-core';
import { describeBitrateHint } from '../../lib/bitrate-text';
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
  /** Calculator fields in a second row under the stream settings (e.g. Storage's recording). */
  detailFields?: ReactNode;
}

/**
 * A camera group's fields in a grid with labels above: cameras and main-stream
 * settings, any calculator fields, then an always-open Bitrate section with the
 * Estimated / Manual toggle. Scene complexity only feeds the estimate, so it sits
 * in that section while Estimated is chosen.
 */
export function CameraStreamGrid({
  group,
  perCameraMbps,
  onChange,
  onBitrateSourceChange,
  sceneComplexityHelpNote,
  detailFields,
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
        {detailFields && <div className={classes.detailRow}>{detailFields}</div>}
      </div>
      <section className={classes.bitrateSection} aria-labelledby={`${group.id}-bitrate-title`}>
        <BitrateField
          idPrefix={group.id}
          group={group}
          perCameraMbps={perCameraMbps}
          onSourceChange={onBitrateSourceChange}
          onMbpsChange={(mbps) => applyEnteredBitrate(group, onChange, mbps)}
          title="Bitrate"
          hint={`(${describeBitrateHint(group.bitrate, perCameraMbps)})`}
          estimateFields={
            <div className={classes.sceneField}>
              <SceneComplexityField
                group={group}
                onChange={onChange}
                helpNote={sceneComplexityHelpNote}
                control="select"
              />
            </div>
          }
        />
      </section>
    </FieldLayoutProvider>
  );
}
