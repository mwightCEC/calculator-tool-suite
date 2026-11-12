'use client';

import {
  isPointRange,
  MAX_CAMERAS_PER_VIEWER,
  MAX_REMOTE_VIEWERS,
  VIEWING_BITRATE_SOURCES,
  type RemoteViewing,
  type ValueRange,
} from '@cctv/calc-core';
import { Paper, Select, Switch, Text } from '@mantine/core';
import { EnteredBitrateInput } from '../../../../components/CameraGroupCard/BitrateField';
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { parseOption } from '../../../../lib/camera-labels';
import { formatMbps } from '../../../../lib/format';
import { VIEWING_BITRATE_SOURCE_OPTIONS } from '../_lib/bandwidth-labels';
import { OptionalMbpsInput } from './OptionalMbpsInput';
import classes from './SettingsSection.module.css';

const formatCameras = (count: number) => `${count} ${count === 1 ? 'camera' : 'cameras'}`;

/** "~3.1 Mbps per camera": the average across all camera groups. */
function describeCameraAverage(averagePerCameraMbps: ValueRange): string {
  const approx = isPointRange(averagePerCameraMbps) ? '' : '~';
  return `${approx}${formatMbps(averagePerCameraMbps.typical)} per camera`;
}

interface RemoteViewingSectionProps {
  remoteViewing: RemoteViewing;
  /** Cameras each viewer actually watches, capped at the total camera count. */
  viewedCamerasPerViewer: number;
  /** Average camera bitrate, used by the Average camera bitrate option. */
  averagePerCameraMbps: ValueRange;
  onChange: (changes: Partial<RemoteViewing>) => void;
}

/**
 * Collapsible Optional configuration card (Remote viewing), above the camera groups, with an on/off switch, the
 * viewers, their bitrate and the site upload check. The fields stay in view when the
 * switch is off, disabled. Collapsing the card only hides the fields.
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
    <Paper withBorder radius="lg" className={classes.card}>
      <Disclosure title="Optional configuration" hint="(Remote viewing)" divider={false}>
        <div className={classes.panel}>
          <Switch
            checked={enabled}
            onChange={(event) => onChange({ enabled: event.currentTarget.checked })}
            label="Include remote viewing"
            description="People watching cameras from outside the site, through an app or web client."
          />
          <FieldLayoutProvider value="stacked">
            <div className={classes.grid}>
              <FieldRow label="Viewers" controlId="bandwidth-viewers">
                <NumberStepper
                  id="bandwidth-viewers"
                  value={viewers}
                  onChange={(value) => onChange({ viewers: value })}
                  min={1}
                  max={MAX_REMOTE_VIEWERS}
                  disabled={!enabled}
                />
              </FieldRow>

              <FieldRow
                label="Cameras each"
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
                  disabled={!enabled}
                />
              </FieldRow>

              <FieldRow
                label="Bitrate"
                help="Per-camera bitrate sent to each viewer. Average camera bitrate uses the average of your camera groups. Choose Custom bitrate for a sub-stream or higher-bitrate cameras."
                controlId="bandwidth-viewing-bitrate"
              >
                <Select
                  id="bandwidth-viewing-bitrate"
                  data={VIEWING_BITRATE_SOURCE_OPTIONS}
                  value={bitrateSource}
                  onChange={(value) => {
                    const source = parseOption(VIEWING_BITRATE_SOURCES, value);
                    if (source) {
                      onChange({ bitrateSource: source });
                    }
                  }}
                  allowDeselect={false}
                  disabled={!enabled}
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
                    disabled={!enabled}
                  />
                )}
              </FieldRow>

              <FieldRow
                label="Site upload"
                controlId="bandwidth-site-upload"
                note="Leave empty to skip this check."
              >
                <OptionalMbpsInput
                  id="bandwidth-site-upload"
                  value={siteUploadMbps}
                  onChange={(mbps) => onChange({ siteUploadMbps: mbps })}
                  disabled={!enabled}
                />
              </FieldRow>
            </div>
          </FieldLayoutProvider>
        </div>
      </Disclosure>
    </Paper>
  );
}
