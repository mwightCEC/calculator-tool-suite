import { MAX_CAMERAS_PER_GROUP, MAX_GROUP_NAME_LENGTH } from '@cctv/calc-core';
import { MAX_CAMERA_GROUPS } from '../../../lib/camera-groups/group-list';
import { groupColors } from '../../../theme/palettes';
import type { CameraItem } from './cart-payload';
import { skippedLine, type SkippedLine } from './skipped';

/*
 * Camera lines assigned to one check become device groups: one group per
 * model (SKU) and power input, within the calculators' group limits.
 */

/** A camera line assigned to a check, with the power input the check uses. */
export interface AssignedCamera<Input> {
  camera: CameraItem;
  input: Input;
}

/** Cart lines of one model, merged. */
export interface CameraModel<Input> {
  sku: string;
  name?: string;
  input: Input;
  deviceCount: number;
}

/** Lines of the same model with the same power input become one group, in cart order. */
export function mergeModels<Input>(
  cameras: readonly AssignedCamera<Input>[]
): CameraModel<Input>[] {
  const merged = new Map<string, CameraModel<Input>>();
  for (const { camera, input } of cameras) {
    const key = `${camera.sku}|${JSON.stringify(input)}`;
    const existing = merged.get(key);
    if (existing) {
      existing.deviceCount += camera.qty;
    } else {
      merged.set(key, {
        sku: camera.sku,
        ...(camera.name ? { name: camera.name } : {}),
        input,
        deviceCount: camera.qty,
      });
    }
  }
  return [...merged.values()];
}

export function skippedModel(
  model: CameraModel<unknown>,
  reason: SkippedLine['reason']
): SkippedLine {
  return skippedLine({ ...model, qty: model.deviceCount }, reason);
}

/**
 * The models a calculator can take: up to 1,000 cameras of a model and 20
 * models. The rest are skipped with the reason.
 */
export function fitModels<Input>(models: readonly CameraModel<Input>[]): {
  grouped: CameraModel<Input>[];
  skipped: SkippedLine[];
} {
  const usable = models.filter((model) => model.deviceCount <= MAX_CAMERAS_PER_GROUP);
  return {
    grouped: usable.slice(0, MAX_CAMERA_GROUPS),
    skipped: [
      ...models
        .filter((model) => model.deviceCount > MAX_CAMERAS_PER_GROUP)
        .map((model) => skippedModel(model, 'too-many-devices')),
      ...usable.slice(MAX_CAMERA_GROUPS).map((model) => skippedModel(model, 'too-many-groups')),
    ],
  };
}

/** Group fields every calculator shares: id, the SKU as its name, count and colour. */
export function groupBasics(model: CameraModel<unknown>, index: number) {
  return {
    id: `g${index + 1}`,
    name: model.sku.slice(0, MAX_GROUP_NAME_LENGTH).trim(),
    deviceCount: model.deviceCount,
    // The palette cycles, so neighbouring groups never share a colour.
    colorIndex: index % groupColors.length,
  };
}
