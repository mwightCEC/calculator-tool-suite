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
export {
  cameraBitrateRange,
  changeBitrateSource,
  type BitrateGroupFields,
} from './bitrate/group-bitrate';

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

// Bandwidth calculator
export * from './bandwidth/options';
export {
  bandwidthCameraGroupSchema,
  bandwidthInputSchema,
  createBandwidthCameraGroup,
  createDefaultBandwidthInput,
  networkLinksSchema,
  remoteViewingSchema,
  type BandwidthCameraGroup,
  type BandwidthInput,
  type NetworkLinks,
  type RemoteViewing,
} from './bandwidth/schema';
export {
  isSubStreamModelValidated,
  SUB_STREAM_MODEL,
  subStreamBitrateRange,
  subStreamModelSchema,
  type SubStreamModel,
} from './bandwidth/sub-stream-model';
export {
  checkLink,
  LINK_CAUTION_ABOVE,
  LINK_KINDS,
  LINK_OVER_CAPACITY_ABOVE,
  LINK_STATUSES,
  linkStatus,
  type LinkCheck,
  type LinkKind,
  type LinkStatus,
} from './bandwidth/link-checks';
export {
  calculateBandwidth,
  type BandwidthGroupUsage,
  type BandwidthModels,
  type BandwidthResult,
} from './bandwidth/calculate-bandwidth';
