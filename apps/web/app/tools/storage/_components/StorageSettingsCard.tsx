'use client';

import {
  DRIVE_SIZES_TB,
  MAX_DRIVE_COUNT,
  MAX_RETENTION_DAYS,
  RAID_LEVELS,
  raidDriveStep,
  raidMinDrives,
  RESERVE_PERCENTS,
  type CalculationMode,
  type StorageSettings,
} from '@cctv/calc-core';
import { Paper, Select, Title } from '@mantine/core';
import { FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import {
  DRIVE_SIZE_SELECT_DATA,
  parseOption,
  RAID_SELECT_DATA,
  RESERVE_SELECT_DATA,
} from '../_lib/storage-labels';
import classes from './StorageSettingsCard.module.css';

const RAID_HELP =
  'Redundancy across drives. RAID 1 and 10 mirror (half the raw capacity is usable); RAID 5 uses one drive and RAID 6 two drives of capacity for parity.';

function drivesHelp(minDrives: number, driveStep: number): string {
  const rule =
    driveStep > 1 ? `at least ${minDrives}, in steps of ${driveStep}` : `at least ${minDrives}`;
  return `Number of drives in the recorder. The selected RAID level needs ${rule}.`;
}

interface StorageSettingsCardProps {
  mode: CalculationMode;
  storage: StorageSettings;
  onChange: (changes: Partial<StorageSettings>) => void;
}

export function StorageSettingsCard({ mode, storage, onChange }: StorageSettingsCardProps) {
  const { raidLevel } = storage;
  const minDrives = raidMinDrives(raidLevel);
  const driveStep = raidDriveStep(raidLevel);

  return (
    <Paper
      component="section"
      withBorder
      className={classes.card}
      aria-labelledby="storage-settings-title"
    >
      <Title order={2} id="storage-settings-title" className={classes.title}>
        Storage settings
      </Title>

      {mode === 'storage-needed' ? (
        <FieldRow
          label="Retention"
          help="How many days of footage the recorder must keep before overwriting."
          controlId="storage-retention"
        >
          <NumberStepper
            id="storage-retention"
            value={storage.retentionDays}
            onChange={(retentionDays) => onChange({ retentionDays })}
            min={1}
            max={MAX_RETENTION_DAYS}
            unitLabel="day"
          />
        </FieldRow>
      ) : (
        <FieldRow label="Drives" help={drivesHelp(minDrives, driveStep)} controlId="storage-drives">
          <NumberStepper
            id="storage-drives"
            value={storage.driveCount}
            onChange={(driveCount) => onChange({ driveCount })}
            min={minDrives}
            max={MAX_DRIVE_COUNT}
            step={driveStep}
            unitLabel={driveStep === 1 ? 'drive' : 'drives'}
          />
        </FieldRow>
      )}

      <FieldRow
        label="Drive size"
        help="Capacity per drive in decimal TB (10¹² bytes), as printed on the label. Recorders and operating systems often show binary units (TiB), which makes the same drive look about 9% smaller."
        controlId="storage-drive-size"
      >
        <Select
          id="storage-drive-size"
          data={DRIVE_SIZE_SELECT_DATA}
          value={String(storage.driveSizeTb)}
          onChange={(value) => {
            const driveSizeTb = parseOption(DRIVE_SIZES_TB, value);
            if (driveSizeTb !== undefined) {
              onChange({ driveSizeTb });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow label="RAID" help={RAID_HELP} controlId="storage-raid">
        <Select
          id="storage-raid"
          data={RAID_SELECT_DATA}
          value={raidLevel}
          onChange={(value) => {
            const level = parseOption(RAID_LEVELS, value);
            if (level) {
              onChange({ raidLevel: level });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>

      <FieldRow
        label="Reserve"
        help="Usable capacity kept free as headroom, for example for recorder overhead or growth."
        controlId="storage-reserve"
      >
        <Select
          id="storage-reserve"
          data={RESERVE_SELECT_DATA}
          value={String(storage.reservePercent)}
          onChange={(value) => {
            const reservePercent = parseOption(RESERVE_PERCENTS, value);
            if (reservePercent !== undefined) {
              onChange({ reservePercent });
            }
          }}
          allowDeselect={false}
          className={classes.select}
        />
      </FieldRow>
    </Paper>
  );
}
