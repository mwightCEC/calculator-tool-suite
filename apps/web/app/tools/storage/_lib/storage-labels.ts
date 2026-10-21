import {
  CALCULATION_MODES,
  DRIVE_SIZES_TB,
  RAID_LEVELS,
  RECORDING_MODES,
  RESERVE_PERCENTS,
  type CalculationMode,
  type RaidLevel,
  type RecordingMode,
} from '@cctv/calc-core';
import { toOptions } from '../../../../lib/camera-labels';

// Display labels for Storage-only options. Camera group labels live in lib/camera-labels.

export const CALCULATION_MODE_LABELS: Record<CalculationMode, string> = {
  'storage-needed': 'Storage needed',
  'days-from-capacity': 'Days from capacity',
};

export const RECORDING_MODE_LABELS: Record<RecordingMode, string> = {
  continuous: 'Continuous',
  motion: 'Motion',
  schedule: 'Schedule',
};

export const RAID_LABELS: Record<RaidLevel, string> = {
  none: 'None',
  raid1: 'RAID 1',
  raid5: 'RAID 5',
  raid6: 'RAID 6',
  raid10: 'RAID 10',
};

export const CALCULATION_MODE_OPTIONS = toOptions(CALCULATION_MODES, CALCULATION_MODE_LABELS);
export const RECORDING_MODE_OPTIONS = toOptions(RECORDING_MODES, RECORDING_MODE_LABELS);

// Select data (Mantine Select values are strings).
export const RAID_SELECT_DATA = toOptions(RAID_LEVELS, RAID_LABELS);
export const DRIVE_SIZE_SELECT_DATA = DRIVE_SIZES_TB.map((tb) => ({
  value: String(tb),
  label: `${tb} TB`,
}));
export const RESERVE_SELECT_DATA = RESERVE_PERCENTS.map((percent) => ({
  value: String(percent),
  label: `${percent}%`,
}));
