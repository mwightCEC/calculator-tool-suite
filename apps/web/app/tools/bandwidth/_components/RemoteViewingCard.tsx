'use client';

import { MAX_CAMERAS_PER_VIEWER, MAX_REMOTE_VIEWERS, type RemoteViewing } from '@cctv/calc-core';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { VIEWING_STREAM_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';

const formatCameras = (count: number) => `${count} ${count === 1 ? 'camera' : 'cameras'}`;

interface RemoteViewingCardProps {
  remoteViewing: RemoteViewing;
  /** Cameras each viewer actually watches, capped at the total camera count. */
  viewedCamerasPerViewer: number;
  onChange: (changes: Partial<RemoteViewing>) => void;
}

export function RemoteViewingCard({
  remoteViewing,
  viewedCamerasPerViewer,
  onChange,
}: RemoteViewingCardProps) {
  const { viewers, camerasPerViewer, stream } = remoteViewing;
  const noViewers = viewers === 0;
  const isCapped = viewedCamerasPerViewer < camerasPerViewer;
  const notUsedNote = noViewers ? 'Not used without remote viewers' : undefined;

  return (
    <InputCard id="bandwidth-remote-title" title="Remote viewing">
      <FieldRow
        label="Viewers"
        help="People watching live video from outside the site at the same time, through an app or web client. Use 0 if nobody views remotely."
        controlId="bandwidth-viewers"
      >
        <NumberStepper
          id="bandwidth-viewers"
          value={viewers}
          onChange={(value) => onChange({ viewers: value })}
          min={0}
          max={MAX_REMOTE_VIEWERS}
          unitLabel="viewer"
        />
      </FieldRow>

      <FieldRow
        label="Cameras each"
        help="Cameras each viewer watches at once, for example 4 in a 2 × 2 grid."
        controlId="bandwidth-cameras-per-viewer"
        dimmed={noViewers}
        note={
          notUsedNote ??
          (isCapped
            ? `Capped at ${formatCameras(viewedCamerasPerViewer)}, the system total`
            : undefined)
        }
      >
        <NumberStepper
          id="bandwidth-cameras-per-viewer"
          value={camerasPerViewer}
          onChange={(value) => onChange({ camerasPerViewer: value })}
          min={1}
          max={MAX_CAMERAS_PER_VIEWER}
          unitLabel="camera"
        />
      </FieldRow>

      <FieldRow
        label="Stream"
        help="Stream sent to remote viewers. Grid views usually use the sub-stream; a single full-screen camera usually uses the main stream."
        controlId="bandwidth-viewing-stream"
        dimmed={noViewers}
        note={notUsedNote}
      >
        <OptionButtons
          id="bandwidth-viewing-stream"
          value={stream}
          onChange={(value) => onChange({ stream: value })}
          options={VIEWING_STREAM_OPTIONS}
          aria-labelledby={fieldLabelId('bandwidth-viewing-stream')}
        />
      </FieldRow>
    </InputCard>
  );
}
