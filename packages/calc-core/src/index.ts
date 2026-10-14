// Public API of @cctv/calc-core.

export * from './units';
export * from './options';
export { isPointRange, pointRange, scaleRange, sumRanges, type ValueRange } from './range';

export { BITRATE_MODEL, isBitrateModelValidated } from './bitrate/bitrate-model';
export {
  bitrateModelSchema,
  findPlaceholderValues,
  PLACEHOLDER_PROVENANCE,
  type BitrateModel,
} from './bitrate/bitrate-model-schema';
export {
  estimateBitrateRange,
  estimateTypicalBitrateMbps,
  uncertaintyBandFor,
  type BitrateEstimateInput,
} from './bitrate/estimate-bitrate';
export { cameraBitrateRange, changeBitrateSource } from './bitrate/group-bitrate';

export { dutyCycle, type DutyCycleInput } from './recording/duty-cycle';

export {
  isValidDriveCount,
  minimumDrivesForCapacity,
  normalizeDriveCount,
  raidDriveStep,
  raidMinDrives,
  usableCapacityTb,
} from './raid/raid-levels';

export {
  cameraGroupSchema,
  enteredBitrateMbpsSchema,
  groupBitrateSchema,
  storageCalculationInputSchema,
  storageSettingsSchema,
  MAX_CAMERAS_PER_GROUP,
  MAX_DRIVE_COUNT,
  MAX_GROUP_NAME_LENGTH,
  MAX_RETENTION_DAYS,
  type CameraGroup,
  type GroupBitrate,
  type StorageCalculationInput,
  type StorageSettings,
} from './model/schema';
export {
  createCameraGroup,
  createDefaultStorageCalculationInput,
  DEFAULT_CAMERA_GROUP_SETTINGS,
  DEFAULT_STORAGE_SETTINGS,
} from './model/defaults';

export {
  calculateCameraGroupUsage,
  mbpsToGbPerDay,
  type CameraGroupUsage,
} from './storage/camera-group-usage';
export {
  calculateStorage,
  type CapacityBreakdown,
  type DriveArray,
  type StorageCalculationResult,
} from './storage/calculate-storage';

export {
  cameraModelSchema,
  maxMainStreamBitrateMbps,
  typicalBitrateMbpsFor,
  type CameraModel,
} from './camera-models/camera-model';
