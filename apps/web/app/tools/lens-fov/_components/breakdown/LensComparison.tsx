import type { LensFovResult } from '@cctv/calc-core';
import { Badge, Table, Text, UnstyledButton } from '@mantine/core';
import { describeLensComparison, lensComparisonRows } from '../../_lib/result-summary';
import type { LensFovCalculatorState } from '../../_state/lens-fov-calculator-state';
import classes from './Breakdown.module.css';

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
      <Text className={classes.intro}>
        {describeLensComparison(state, result)} Pick a lens to use it.
      </Text>
      <Table.ScrollContainer minWidth={320} type="native">
        <Table className={classes.table} verticalSpacing={6} horizontalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Lens</Table.Th>
              <Table.Th className={classes.number}>H. FOV</Table.Th>
              {solvingDistance ? (
                <Table.Th className={classes.number}>Farthest distance</Table.Th>
              ) : (
                <>
                  <Table.Th className={classes.number}>Width</Table.Th>
                  <Table.Th className={classes.number}>Pixel density</Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.focalLengthMm} data-current={row.current || undefined}>
                <Table.Td>
                  <span className={classes.lensCell}>
                    <UnstyledButton
                      className={classes.lensButton}
                      onClick={() => onSelectLens(row.focalLengthMm)}
                      aria-pressed={row.current}
                      aria-label={`Use the ${row.lens} lens`}
                    >
                      {row.lens}
                    </UnstyledButton>
                    {row.current && (
                      <Badge size="xs" variant="light" radius="sm">
                        Current
                      </Badge>
                    )}
                  </span>
                </Table.Td>
                <Table.Td className={classes.number}>{row.fov}</Table.Td>
                <Table.Td className={classes.number}>{row.reach}</Table.Td>
                {!solvingDistance && <Table.Td className={classes.number}>{row.density}</Table.Td>}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  );
}
