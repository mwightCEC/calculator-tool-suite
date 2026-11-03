import type { LensFovResult } from '@cctv/calc-core';
import { Table, Text, UnstyledButton } from '@mantine/core';
import { lensComparisonRows } from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import classes from './ResultsCard.module.css';

interface LensComparisonProps {
  state: LensFovCalculatorState;
  result: LensFovResult;
  onSelectLens: (focalLengthMm: number) => void;
}

/** Common lenses on this camera; picking one makes it the lens. */
export function LensComparison({ state, result, onSelectLens }: LensComparisonProps) {
  const rows = lensComparisonRows(state, result.lensComparison);
  const solvingDistance = state.solveFor === 'distance';

  return (
    <div>
      <Text component="h3" className={classes.sectionTitle}>
        Lens comparison
      </Text>
      {/* Five columns don't fit a phone-width card, so the table scrolls sideways there. */}
      <Table.ScrollContainer minWidth={340} type="native">
        <Table className={classes.table} verticalSpacing={4} horizontalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Lens</Table.Th>
              <Table.Th className={classes.number}>FOV</Table.Th>
              <Table.Th className={classes.number}>{solvingDistance ? 'Up to' : 'Width'}</Table.Th>
              {!solvingDistance && (
                <>
                  <Table.Th className={classes.number}>Density</Table.Th>
                  <Table.Th>DORI</Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.focalLengthMm} data-current={row.current || undefined}>
                <Table.Td>
                  <UnstyledButton
                    className={classes.lensButton}
                    onClick={() => onSelectLens(row.focalLengthMm)}
                    aria-pressed={row.current}
                    aria-label={`Use the ${row.lens} lens`}
                  >
                    {row.lens}
                  </UnstyledButton>
                </Table.Td>
                <Table.Td className={classes.number}>{row.fov}</Table.Td>
                <Table.Td className={classes.number}>{row.reach}</Table.Td>
                {!solvingDistance && (
                  <>
                    <Table.Td className={classes.number}>{row.density}</Table.Td>
                    <Table.Td>{row.level}</Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Text className={classes.note}>Pick a lens to use it.</Text>
    </div>
  );
}
