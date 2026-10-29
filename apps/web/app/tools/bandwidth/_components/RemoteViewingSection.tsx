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
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import {
  FieldLayoutProvider,
  FieldRow,
  fieldLabelId,
} from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { formatMbps } from '../../../../lib/format';
import { VIEWING_BITRATE_SOURCE_OPTIONS } from '../_lib/bandwidth-labels';
import { OptionalMbpsInput } from './OptionalMbpsInput';
import classes from './SettingsSection.module.css';

const formatCameras = (count: number) => `${count} ${count === 1 ? 'camera' : 'cameras'}`;

/** "~3.1 Mbps per camera, the average across all camera groups". */
function describeCameraAverage(averagePerCameraMbps: ValueRange): string {
  const approx = isPointRange(averagePerCameraMbps) ? '' : '~';
  return `${approx}${formatMbps(averagePerCameraMbps.typical)} per camera, the average across all camera groups`;
}

interface RemoteViewingSectionProps {
  remoteViewing: RemoteViewing;
  /** Cameras each viewer actually watches, capped at the total camera count. */
  viewedCamerasPerViewer: number;
  /** Average camera bitrate, used by the Camera bitrate option. */
  averagePerCameraMbps: ValueRange;
  onChange: (changes: Partial<RemoteViewing>) => void;
}

/**
 * Collapsible Remote viewing section with an on/off switch; when on, the viewers,
 * their bitrate and the site upload check. Collapsing it only hides the fields.
 */
export function RemoteViewingSection({
  remoteViewing,
  viewedCamerasPerViewer,
  averagePerCameraMbps,
  onChange,
}: RemoteViewingSectionProps) {
  const { enabled, viewers, camerasPerViewer, bitrateSource, customMbps, siteUploadMbps } =
    remoteViewing;
  const isCapped = viewedCamerasPerViewer < camerasPerViewer;

  return (
    <Disclosure title="Remote viewing" hint="(optional)">
      <div className={classes.panel}>
        <Switch
          checked={enabled}
          onChange={(event) => onChange({ enabled: event.currentTarget.checked })}
          label="Include remote viewing"
          description="People watching cameras from outside the site, through an app or web client."
        />
        {enabled && (
          <FieldLayoutProvider value="stacked">
            <div className={classes.grid}>
              <FieldRow
                label="Viewers"
                controlId="bandwidth-viewers"
                note="Watching at the same time"
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
                controlId="bandwidth-cameras-per-viewer"
                note={
                  isCapped
                    ? `Capped at ${formatCameras(viewedCamerasPerViewer)}, the system total`
                    : 'For example 4 in a 2 × 2 grid'
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
                controlId="bandwidth-site-upload"
                note="The site's internet upload speed. Leave empty to skip this check."
              >
                <OptionalMbpsInput
                  id="bandwidth-site-upload"
                  value={siteUploadMbps}
                  onChange={(mbps) => onChange({ siteUploadMbps: mbps })}
                />
              </FieldRow>
            </div>
          </FieldLayoutProvider>
        )}
      </div>
    </Disclosure>
  );
}
