import type { LensFovResult } from '@cctv/calc-core';
import { IconCheck } from '@tabler/icons-react';
import { Table, Text } from '@mantine/core';
import { doriDistanceRows } from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import classes from './ResultsCard.module.css';

interface DoriDistancesProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
}

/** The farthest distance for each DORI level with this camera and lens. */
export function DoriDistances({ state, result }: DoriDistancesProps) {
  const rows = doriDistanceRows(state, result);
  return (
    <div>
      <Text component="h3" className={classes.sectionTitle}>
        DORI distances
      </Text>
      <Table className={classes.table} verticalSpacing={4} horizontalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Level</Table.Th>
            <Table.Th className={classes.number}>Density</Table.Th>
            <Table.Th className={classes.number}>Up to</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.level} data-met={row.met || undefined}>
              <Table.Td>
                <span className={classes.level}>
                  {row.label}
                  {row.met && (
                    <IconCheck
                      size={14}
                      stroke={2.25}
                      className={classes.metIcon}
                      aria-label="met at this distance"
                    />
                  )}
                </span>
              </Table.Td>
              <Table.Td className={classes.number}>{row.density}</Table.Td>
              <Table.Td className={classes.number}>{row.distance}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
