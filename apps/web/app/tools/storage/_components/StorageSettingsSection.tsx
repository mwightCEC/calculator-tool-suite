'use client';

import type { ReactNode } from 'react';
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
import { Group, Select, Text, ThemeIcon, Title } from '@mantine/core';
import { Disclosure } from '../../../../components/Disclosure/Disclosure';
import { FieldLayoutProvider, FieldRow } from '../../../../components/FieldRow/FieldRow';
import { NumberStepper } from '../../../../components/NumberStepper/NumberStepper';
import { parseOption } from '../../../../lib/camera-labels';
import {
  DRIVE_SIZE_SELECT_DATA,
  RAID_SELECT_DATA,
  RESERVE_SELECT_DATA,
} from '../_lib/storage-labels';
import classes from './StorageSettingsSection.module.css';

const RAID_HELP =
  'Redundancy across drives. RAID 1 and 10 mirror (half the raw capacity is usable); RAID 5 uses one drive and RAID 6 two drives of capacity for parity.';

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

interface StorageSettingsSectionProps extends SettingsProps {
  mode: CalculationMode;
}

/**
 * Storage needed: a Retention goal panel, then the drives to size under a collapsible
 * Drive configuration section. Collapsing it only hides the fields; they still apply.
 * Days from capacity: one Storage configuration panel with the drives entered.
 */
export function StorageSettingsSection({ mode, storage, onChange }: StorageSettingsSectionProps) {
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
    <>
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
              unitLabel="day"
            />
            <Text size="sm">days</Text>
          </Group>
        }
      />

      <Disclosure title="Drive configuration" hint="(optional)">
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
    </>
  );
}

interface SettingsPanelProps {
  icon: ReactNode;
  title: string;
  /** Id of the control the title labels, when the panel holds a single control. */
  titleFor?: string;
  description: string;
  /** A single control beside the title, e.g. the retention stepper. */
  control?: ReactNode;
  /** Fields below the title. */
  children?: ReactNode;
}

/** Tinted panel with an icon, title and description, as in the approved prototype. */
function SettingsPanel({
  icon,
  title,
  titleFor,
  description,
  control,
  children,
}: SettingsPanelProps) {
  return (
    <section className={classes.panel} aria-label={title}>
      <Group justify="space-between" align="center" gap="md" className={classes.panelHeader}>
        <Group gap="md" wrap="nowrap" align="center" className={classes.panelHeading}>
          <ThemeIcon variant="light" size={40} radius="md">
            {icon}
          </ThemeIcon>
          <div>
            <Title order={3} className={classes.panelTitle}>
              {titleFor ? <label htmlFor={titleFor}>{title}</label> : title}
            </Title>
            <Text size="sm" className={classes.description}>
              {description}
            </Text>
          </div>
        </Group>
        {control}
      </Group>
      {children && <FieldLayoutProvider value="stacked">{children}</FieldLayoutProvider>}
    </section>
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
        unitLabel={driveStep === 1 ? 'drive' : 'drives'}
      />
    </FieldRow>
  );
}

function DriveSizeField({ storage, onChange }: SettingsProps) {
  return (
    <FieldRow
      label="Drive size"
      note="Decimal TB, as printed on drives"
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
  );
}

function RaidField({ storage, onChange }: SettingsProps) {
  return (
    <FieldRow
      label="RAID level"
      help={RAID_HELP}
      note={driveRuleNote(storage.raidLevel)}
      controlId="storage-raid"
    >
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
    <FieldRow
      label="Recording reserve"
      help="Usable capacity kept free as headroom, for example for recorder overhead or growth."
      note="Free space kept beyond the video storage needed"
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
  );
}
