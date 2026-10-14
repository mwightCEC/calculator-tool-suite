import bitrateModelJson from '../data/bitrate-model.json';
import { bitrateModelSchema, type BitrateModel } from './bitrate-model-schema';

/**
 * The active bitrate model, validated when this module loads.
 * Values live in data/bitrate-model.json; see data/README.md to update them.
 */
export const BITRATE_MODEL: BitrateModel = bitrateModelSchema.parse(bitrateModelJson);

/** Whether estimates come from validated data. Surface this in the UI. */
export const isBitrateModelValidated: boolean = BITRATE_MODEL.status === 'validated';
