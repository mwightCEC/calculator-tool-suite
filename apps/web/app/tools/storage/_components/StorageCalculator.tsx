'use client';

import type { ReactNode } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Stack } from '@mantine/core';
import { CameraGroupToolbar } from '../../../../components/CameraGroupCard/CameraGroupToolbar';
import { useGroupExpansion } from '../../../../components/CameraGroupCard/use-group-expansion';
import { MobileResultBar } from '../../../../components/MobileResultBar/MobileResultBar';
import { MAX_CAMERA_GROUPS } from '../../../../lib/camera-groups/group-list';
import { describeHeadline } from '../_lib/result-summary';
import { useStorageCalculator } from '../_state/use-storage-calculator';
import { StorageCameraGroupCard } from './camera-group/StorageCameraGroupCard';
import { HowCalculated } from './HowCalculated';
import { PrintSummary } from './print/PrintSummary';
import { RESULTS_CARD_ID, ResultsCard } from './results/ResultsCard';
import { StorageSettingsCard } from './StorageSettingsCard';
import classes from './StorageCalculator.module.css';

interface StorageCalculatorProps {
  /** Server-rendered page title and introduction. */
  header: ReactNode;
}

/** Two columns on large screens: inputs on the left, sticky results on the right. */
export function StorageCalculator({ header }: StorageCalculatorProps) {
  const { state, result, hasCustomGroups, actions } = useStorageCalculator();
  const expansion = useGroupExpansion(state.cameraGroups.map((group) => group.id));
  const groupCount = state.cameraGroups.length;
  const atGroupLimit = groupCount >= MAX_CAMERA_GROUPS;
  const usageByGroupId = new Map(result.groups.map((usage) => [usage.groupId, usage]));
  const headline = describeHeadline(result);

  return (
    <>
      <div className={classes.layout}>
        <Stack gap="md" className={classes.inputs}>
          {header}

          <CameraGroupToolbar
            allCollapsed={expansion.allCollapsed}
            onToggleAll={expansion.toggleAll}
            canClear={hasCustomGroups}
            onClear={() => {
              actions.clearGroups();
              expansion.expandAll();
            }}
          />

          {state.cameraGroups.map((group) => {
            const usage = usageByGroupId.get(group.id);
            return (
              usage && (
                <StorageCameraGroupCard
                  key={group.id}
                  group={group}
                  usage={usage}
                  expanded={expansion.isExpanded(group.id)}
                  onToggleExpanded={() => expansion.toggle(group.id)}
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
          <ResultsCard result={result} state={state} onModeChange={actions.setMode} />
        </div>

        <MobileResultBar
          label={headline.label}
          value={headline.value}
          detail={headline.likelyRange}
          resultsId={RESULTS_CARD_ID}
        />
      </div>
      <PrintSummary state={state} result={result} />
    </>
  );
}
