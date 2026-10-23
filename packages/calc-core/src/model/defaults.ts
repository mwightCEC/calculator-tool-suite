import type { CameraGroup, StorageCalculationInput, StorageSettings } from './schema';

type CameraGroupSettings = Omit<CameraGroup, 'id' | 'name'>;

export const DEFAULT_CAMERA_GROUP_SETTINGS: CameraGroupSettings = {
  cameraCount: 8,
  resolution: '4MP',
  codec: 'h265',
  frameRate: 15,
  sceneComplexity: 'medium',
  recordingMode: 'continuous',
  motionPercent: 30,
  scheduleHours: 12,
  bitrate: { source: 'estimate' },
};

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  retentionDays: 30,
  driveCount: 4,
  driveSizeTb: 14,
  raidLevel: 'none',
  reservePercent: 0,
};

export function createCameraGroup(id: string, name: string): CameraGroup {
  return { id, name, ...DEFAULT_CAMERA_GROUP_SETTINGS };
}

export function createDefaultStorageCalculationInput(): StorageCalculationInput {
  return {
    mode: 'storage-needed',
    cameraGroups: [createCameraGroup('group-1', 'Camera group 1')],
    storage: { ...DEFAULT_STORAGE_SETTINGS },
  };
}
