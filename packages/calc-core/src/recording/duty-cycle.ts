import type { RecordingMode } from '../options';
import { HOURS_PER_DAY } from '../units';

export interface DutyCycleInput {
  recordingMode: RecordingMode;
  /** Percent of the day with motion, including pre/post-event buffers. */
  motionPercent: number;
  /** Recorded hours per day in schedule mode. */
  scheduleHours: number;
}

/** Fraction of the day (0–1) that footage is written to disk. */
export function dutyCycle(input: DutyCycleInput): number {
  switch (input.recordingMode) {
    case 'continuous':
      return 1;
    case 'motion':
      return input.motionPercent / 100;
    case 'schedule':
      return input.scheduleHours / HOURS_PER_DAY;
  }
}
