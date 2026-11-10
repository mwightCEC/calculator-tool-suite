'use client';

import { OVERHEAD_PERCENTS, type OverheadPercent } from '@cctv/calc-core';
import { IconPercentage } from '@tabler/icons-react';
import { Paper, Select } from '@mantine/core';
import { SettingsPanel } from '../../../../components/SettingsPanel/SettingsPanel';
import { parseOption } from '../../../../lib/camera-labels';
import { OVERHEAD_OPTIONS } from '../_lib/bandwidth-labels';
import classes from './SettingsSection.module.css';

interface OverheadSectionProps {
  overheadPercent: OverheadPercent;
  onChange: (overheadPercent: OverheadPercent) => void;
}

/**
 * The overhead allowance, in its own always-open card above Remote viewing: it is added
 * to every total, so it isn't an optional setting.
 */
export function OverheadSection({ overheadPercent, onChange }: OverheadSectionProps) {
  return (
    <Paper withBorder radius="lg" p="sm">
      <SettingsPanel
        icon={<IconPercentage size={20} stroke={1.75} />}
        title="Overhead allowance"
        titleFor="bandwidth-overhead"
        description="Added to every total for network protocol overhead and short bursts above the average."
        control={
          <Select
            id="bandwidth-overhead"
            data={OVERHEAD_OPTIONS}
            value={String(overheadPercent)}
            onChange={(value) => {
              const percent = parseOption(OVERHEAD_PERCENTS, value);
              if (percent !== undefined) {
                onChange(percent);
              }
            }}
            allowDeselect={false}
            className={classes.overheadSelect}
          />
        }
      />
    </Paper>
  );
}
