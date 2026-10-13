// Public API of @cctv/calc-core.

export * from './units';
export * from './options';

export { PLACEHOLDER_BITRATE_MODEL } from './bitrate/placeholder-bitrate-coefficients';
export {
  estimateBitrateMbps,
  isBitrateEstimateValidated,
  type BitrateEstimateInput,
} from './bitrate/estimate-bitrate';

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
  storageCalculationInputSchema,
  storageSettingsSchema,
  MAX_CAMERAS_PER_GROUP,
  MAX_DRIVE_COUNT,
  MAX_GROUP_NAME_LENGTH,
  MAX_RETENTION_DAYS,
  type CameraGroup,
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
