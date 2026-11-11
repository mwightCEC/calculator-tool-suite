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
  type RaidLevel,
  type StorageSettings,
} from '@cctv/calc-core';
import { IconCalendarEvent, IconServer2 } from '@tabler/icons-react';
import { Group, Paper, Select, Text } from '@mantine/core';
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { SettingsPanel } from '../../../../components/SettingsPanel/SettingsPanel';
import { parseOption } from '../../../../lib/camera-labels';
import {
  DRIVE_SIZE_SELECT_DATA,
  RAID_SELECT_DATA,
  RESERVE_SELECT_DATA,
} from '../_lib/storage-labels';
import classes from './StorageSettings.module.css';

/** What the RAID level needs, e.g. "Needs 4 or more drives, in pairs"; null for no RAID. */
function driveRuleNote(level: RaidLevel): string | null {
  if (level === 'none') {
    return null;
  }
  const minDrives = raidMinDrives(level);
  const driveStep = raidDriveStep(level);
  const steps = driveStep === 2 ? ', in pairs' : driveStep > 2 ? `, in steps of ${driveStep}` : '';
  return `Needs ${minDrives} or more drives${steps}`;
}

interface SettingsProps {
  storage: StorageSettings;
  onChange: (changes: Partial<StorageSettings>) => void;
}

interface StorageGoalPanelProps extends SettingsProps {
  mode: CalculationMode;
}

/**
 * The chosen mode's goal, under the mode choice cards.
 * Storage needed: a Retention goal panel (the drives to size are in DriveConfigurationCard).
 * Days from capacity: one Storage configuration panel with the drives entered.
 */
export function StorageGoalPanel({ mode, storage, onChange }: StorageGoalPanelProps) {
  if (mode === 'days-from-capacity') {
    return (
      <SettingsPanel
        icon={<IconServer2 size={20} stroke={1.75} />}
        title="Storage configuration"
        description="Enter the drives in your recorder to estimate how many days of video it can keep."
      >
        <div className={classes.grid}>
          <RaidField storage={storage} onChange={onChange} />
          <DriveCountField storage={storage} onChange={onChange} />
          <DriveSizeField storage={storage} onChange={onChange} />
          <ReserveField storage={storage} onChange={onChange} />
        </div>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel
      icon={<IconCalendarEvent size={20} stroke={1.75} />}
      title="Retention goal"
      titleFor="storage-retention"
      description="How many days of video do you want to keep?"
      control={
        <Group gap="xs" wrap="nowrap">
          <NumberStepper
            id="storage-retention"
            value={storage.retentionDays}
            onChange={(retentionDays) => onChange({ retentionDays })}
            min={1}
            max={MAX_RETENTION_DAYS}
          />
          <Text size="sm">days</Text>
        </Group>
      }
    />
  );
}

/**
 * Storage needed only: the drives to size, in their own card above the camera groups.
 * Collapsing it only hides the fields; they still apply.
 */
export function DriveConfigurationCard({ storage, onChange }: SettingsProps) {
  return (
    <Paper withBorder radius="lg" className={classes.card}>
      <Disclosure title="Drive configuration" hint="(optional)" divider={false}>
        <div className={classes.fieldsPanel}>
          <Text size="sm" className={classes.description}>
            Sizes the recommended drives for this estimate from the RAID level, drive size and
            reserve.
          </Text>
          <FieldLayoutProvider value="stacked">
            <div className={classes.grid} data-columns={3}>
              <RaidField storage={storage} onChange={onChange} />
              <DriveSizeField storage={storage} onChange={onChange} />
              <ReserveField storage={storage} onChange={onChange} />
            </div>
          </FieldLayoutProvider>
        </div>
      </Disclosure>
    </Paper>
  );
}

function DriveCountField({ storage, onChange }: SettingsProps) {
  const minDrives = raidMinDrives(storage.raidLevel);
  const driveStep = raidDriveStep(storage.raidLevel);
  return (
    <FieldRow label="Number of drives" controlId="storage-drives">
      <NumberStepper
        id="storage-drives"
        value={storage.driveCount}
        onChange={(driveCount) => onChange({ driveCount })}
        min={minDrives}
        max={MAX_DRIVE_COUNT}
        step={driveStep}
      />
    </FieldRow>
  );
}

function DriveSizeField({ storage, onChange }: SettingsProps) {
  return (
    <FieldRow label="Drive size" controlId="storage-drive-size">
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
  );
}

function RaidField({ storage, onChange }: SettingsProps) {
  return (
    <FieldRow label="RAID level" note={driveRuleNote(storage.raidLevel)} controlId="storage-raid">
      <Select
        id="storage-raid"
        data={RAID_SELECT_DATA}
        value={storage.raidLevel}
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
  );
}

function ReserveField({ storage, onChange }: SettingsProps) {
  return (
    <FieldRow label="Recording reserve" controlId="storage-reserve">
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
  );
}
