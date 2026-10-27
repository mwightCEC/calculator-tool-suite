'use client';

import {
  isPointRange,
  MAX_CAMERAS_PER_VIEWER,
  MAX_REMOTE_VIEWERS,
  type RemoteViewing,
  type ValueRange,
} from '@cctv/calc-core';
import { Switch, Text } from '@mantine/core';
import { EnteredBitrateInput } from '../../../../components/CameraGroupCard/BitrateField';
import { FieldRow, fieldLabelId } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { formatMbps } from '../../../../lib/format';
import { VIEWING_BITRATE_SOURCE_OPTIONS } from '../_lib/bandwidth-labels';
import { InputCard } from './InputCard';
import { OptionalMbpsInput } from './OptionalMbpsInput';
import classes from './BandwidthCalculator.module.css';

const TITLE_ID = 'bandwidth-remote-title';

const formatCameras = (count: number) => `${count} ${count === 1 ? 'camera' : 'cameras'}`;

/** "~3.1 Mbps per camera, the average across all camera groups". */
function describeCameraAverage(averagePerCameraMbps: ValueRange): string {
  const approx = isPointRange(averagePerCameraMbps) ? '' : '~';
  return `${approx}${formatMbps(averagePerCameraMbps.typical)} per camera, the average across all camera groups`;
}

interface RemoteViewingCardProps {
  remoteViewing: RemoteViewing;
  /** Cameras each viewer actually watches, capped at the total camera count. */
  viewedCamerasPerViewer: number;
  /** Average camera bitrate, used by the Camera bitrate option. */
  averagePerCameraMbps: ValueRange;
  onChange: (changes: Partial<RemoteViewing>) => void;
}

/** Remote viewing with an on/off switch; when on, the viewers, their bitrate and the site upload check. */
export function RemoteViewingCard({
  remoteViewing,
  viewedCamerasPerViewer,
  averagePerCameraMbps,
  onChange,
}: RemoteViewingCardProps) {
  const { enabled, viewers, camerasPerViewer, bitrateSource, customMbps, siteUploadMbps } =
    remoteViewing;
  const isCapped = viewedCamerasPerViewer < camerasPerViewer;

  return (
    <InputCard
      id={TITLE_ID}
      title="Remote viewing"
      titleAction={
        <Switch
          checked={enabled}
          onChange={(event) => onChange({ enabled: event.currentTarget.checked })}
          onLabel="ON"
          offLabel="OFF"
          size="md"
          aria-labelledby={TITLE_ID}
        />
      }
    >
      {enabled ? (
        <>
          <FieldRow
            label="Viewers"
            help="People watching live video from outside the site at the same time, through an app or web client."
            controlId="bandwidth-viewers"
          >
            <NumberStepper
              id="bandwidth-viewers"
              value={viewers}
              onChange={(value) => onChange({ viewers: value })}
              min={1}
              max={MAX_REMOTE_VIEWERS}
              unitLabel="viewer"
            />
          </FieldRow>

          <FieldRow
            label="Cameras each"
            help="Cameras each viewer watches at once, for example 4 in a 2 × 2 grid."
            controlId="bandwidth-cameras-per-viewer"
            note={
              isCapped
                ? `Capped at ${formatCameras(viewedCamerasPerViewer)}, the system total`
                : undefined
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
            label="Bitrate"
            help="Per-camera bitrate sent to each viewer. Camera bitrate uses the average of your camera groups. Choose Custom bitrate when viewers watch a lower-bitrate stream, such as a sub-stream for grid views."
            controlId="bandwidth-viewing-bitrate"
          >
            <OptionButtons
              id="bandwidth-viewing-bitrate"
              value={bitrateSource}
              onChange={(value) => onChange({ bitrateSource: value })}
              options={VIEWING_BITRATE_SOURCE_OPTIONS}
              aria-labelledby={fieldLabelId('bandwidth-viewing-bitrate')}
            />
            {bitrateSource === 'camera' ? (
              <Text size="sm" className={classes.secondaryText}>
                {describeCameraAverage(averagePerCameraMbps)}
              </Text>
            ) : (
              <EnteredBitrateInput
                id="bandwidth-viewing-custom-mbps"
                label="Custom bitrate per camera (Mbps)"
                value={customMbps}
                onChange={(mbps) => onChange({ customMbps: mbps })}
              />
            )}
          </FieldRow>

          <FieldRow
            label="Site upload"
            help="The site's internet upload speed. Checked against the remote viewing bandwidth."
            controlId="bandwidth-site-upload"
            note="Leave empty to skip this check"
          >
            <OptionalMbpsInput
              id="bandwidth-site-upload"
              value={siteUploadMbps}
              onChange={(mbps) => onChange({ siteUploadMbps: mbps })}
            />
          </FieldRow>
        </>
      ) : (
        <Text size="sm" className={classes.secondaryText}>
          Turn on to estimate bandwidth for people viewing cameras from outside the site.
        </Text>
      )}
    </InputCard>
  );
}
