'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Stack } from '@mantine/core';
import { OptionButtons } from '../../../../components/OptionButtons/OptionButtons';
import { CALCULATION_MODE_OPTIONS } from '../_lib/storage-labels';
import { MAX_CAMERA_GROUPS } from '../_state/storage-calculator-state';
import { useStorageCalculator } from '../_state/use-storage-calculator';
import { CameraGroupCard } from './camera-group/CameraGroupCard';
import { HowCalculated } from './HowCalculated';
import { MobileResultBar } from './results/MobileResultBar';
import { ResultsCard } from './results/ResultsCard';
import { StorageSettingsCard } from './StorageSettingsCard';
import classes from './StorageCalculator.module.css';

interface StorageCalculatorProps {
  /** Server-rendered page title and introduction. */
  header: ReactNode;
}

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function StorageCalculator({ header }: StorageCalculatorProps) {
  const { state, result, actions } = useStorageCalculator();
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));

  return (
    <div className={classes.layout}>
      <Stack gap="md" className={classes.inputs}>
        <Stack gap="sm">
          {header}
          <OptionButtons
            value={state.mode}
            onChange={actions.setMode}
            options={CALCULATION_MODE_OPTIONS}
            aria-label="Calculation mode"
          />
        </Stack>

        {state.cameraGroups.map((group) => {
          const usage = usageByGroupId.get(group.id);
          return (
            usage && (
              <CameraGroupCard
                key={group.id}
                group={group}
                usage={usage}
                canDuplicate={!atGroupLimit}
                canDelete={groupCount > 1}
                actions={actions}
              />
            )
          );
        })}

        <Button
          variant="default"
          leftSection={<IconPlus size={16} />}
          onClick={actions.addGroup}
          disabled={atGroupLimit}
          className={classes.addGroup}
        >
          {atGroupLimit ? `Up to ${MAX_CAMERA_GROUPS} camera groups` : 'Add camera group'}
        </Button>

        <StorageSettingsCard
          mode={state.mode}
          storage={state.storage}
          onChange={actions.updateStorage}
        />

        <HowCalculated />
      </Stack>

      <div className={classes.results}>
        <ResultsCard
          result={result}
          groups={state.cameraGroups}
          retentionTargetDays={state.storage.retentionDays}
        />
      </div>

      <MobileResultBar result={result} />
    </div>
  );
}
