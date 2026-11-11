'use client';

import { useState } from 'react';
import {
  COMMON_FOCAL_LENGTHS_MM,
  MAX_FOCAL_LENGTH_MM,
  MAX_IMAGE_PIXELS,
  MAX_SENSOR_MM,
  MIN_FOCAL_LENGTH_MM,
  MIN_IMAGE_PIXELS,
  MIN_SENSOR_MM,
  RESOLUTIONS,
  SENSOR_FORMATS,
} from '@cctv/calc-core';
import { Select } from '@mantine/core';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { UnitInput } from '../../../../components/UnitInput/UnitInput';
import { parseOption } from '../../../../lib/camera-labels';
import { LENS_OPTIONS, RESOLUTION_OPTIONS, SENSOR_OPTIONS } from '../_lib/lens-fov-labels';
import { CUSTOM, type LensFovCalculatorState } from '../_state/lens-fov-calculator-state';
import type { LensFovCalculatorActions } from '../_state/use-lens-fov-calculator';
import classes from './LensFovCalculator.module.css';

interface CameraFieldsProps {
  state: LensFovCalculatorState;
  actions: LensFovCalculatorActions;
}

/** The camera's resolution, sensor and lens, with custom sizes when those are chosen. */
export function CameraFields({ state, actions }: CameraFieldsProps) {
  const { resolution, sensor, focalLengthMm } = state;
  const commonLens = COMMON_FOCAL_LENGTHS_MM.find((mm) => mm === focalLengthMm);
  // Custom stays chosen while its focal length still matches a common lens, e.g. just after picking it.
  const [customLensChosen, setCustomLensChosen] = useState(false);
  const showCustomLens = customLensChosen || commonLens === undefined;

  return (
    <FieldLayoutProvider value="stacked">
      <div className={classes.fields}>
        <div className={classes.fieldGrid} data-columns="3">
          <FieldRow label="Resolution" controlId="lens-resolution">
            <Select
              id="lens-resolution"
              data={RESOLUTION_OPTIONS}
              value={resolution.kind === 'custom' ? CUSTOM : resolution.resolution}
              onChange={(value) => {
                const picked = value === CUSTOM ? CUSTOM : parseOption(RESOLUTIONS, value);
                if (picked) {
                  actions.setResolution(picked);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          <FieldRow label="Sensor" controlId="lens-sensor">
            <Select
              id="lens-sensor"
              data={SENSOR_OPTIONS}
              value={sensor.kind === 'custom' ? CUSTOM : sensor.format}
              onChange={(value) => {
                const picked = value === CUSTOM ? CUSTOM : parseOption(SENSOR_FORMATS, value);
                if (picked) {
                  actions.setSensor(picked);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          <FieldRow label="Lens" controlId="lens-focal">
            <Select
              id="lens-focal"
              data={LENS_OPTIONS}
              value={showCustomLens ? CUSTOM : String(commonLens)}
              onChange={(value) => {
                if (value === CUSTOM) {
                  setCustomLensChosen(true);
                  return;
                }
                const mm = parseOption(COMMON_FOCAL_LENGTHS_MM, value);
                if (mm !== undefined) {
                  setCustomLensChosen(false);
                  actions.setFocalLength(mm);
                }
              }}
              allowDeselect={false}
              className={classes.select}
            />
          </FieldRow>

          {showCustomLens && (
            <FieldRow label="Focal length" controlId="lens-focal-custom">
              <UnitInput
                id="lens-focal-custom"
                value={focalLengthMm}
                onChange={actions.setFocalLength}
                min={MIN_FOCAL_LENGTH_MM}
                max={MAX_FOCAL_LENGTH_MM}
                decimals={1}
                unit="mm"
              />
            </FieldRow>
          )}

          {resolution.kind === 'custom' && (
            <>
              <FieldRow label="Image width" controlId="lens-image-width">
                <UnitInput
                  id="lens-image-width"
                  value={resolution.width}
                  onChange={(width) => actions.setCustomResolution({ width })}
                  min={MIN_IMAGE_PIXELS}
                  max={MAX_IMAGE_PIXELS}
                  decimals={0}
                  unit="px"
                />
              </FieldRow>
              <FieldRow label="Image height" controlId="lens-image-height">
                <UnitInput
                  id="lens-image-height"
                  value={resolution.height}
                  onChange={(height) => actions.setCustomResolution({ height })}
                  min={MIN_IMAGE_PIXELS}
                  max={MAX_IMAGE_PIXELS}
                  decimals={0}
                  unit="px"
                />
              </FieldRow>
            </>
          )}

          {sensor.kind === 'custom' && (
            <>
              <FieldRow label="Sensor width" controlId="lens-sensor-width">
                <UnitInput
                  id="lens-sensor-width"
                  value={sensor.widthMm}
                  onChange={(widthMm) => actions.setCustomSensor({ widthMm })}
                  min={MIN_SENSOR_MM}
                  max={MAX_SENSOR_MM}
                  decimals={2}
                  unit="mm"
                />
              </FieldRow>
              <FieldRow label="Sensor height" controlId="lens-sensor-height">
                <UnitInput
                  id="lens-sensor-height"
                  value={sensor.heightMm}
                  onChange={(heightMm) => actions.setCustomSensor({ heightMm })}
                  min={MIN_SENSOR_MM}
                  max={MAX_SENSOR_MM}
                  decimals={2}
                  unit="mm"
                />
              </FieldRow>
            </>
          )}
        </div>
      </div>
    </FieldLayoutProvider>
  );
}
