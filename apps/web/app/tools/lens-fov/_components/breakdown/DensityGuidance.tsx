import { Table, Text } from '@mantine/core';
import { densityGuidanceRows } from '../../_lib/density-guidance';
import classes from './Breakdown.module.css';

/** One published set of pixel density levels, for reference beside the calculated density. */
export function DensityGuidance() {
  return (
    <div>
      <Text component="h3" className={classes.sectionTitle}>
        Pixel density guidance
      </Text>
      <Text className={classes.intro}>
        Higher pixel density gives more image detail at the target. Design with the calculated PPF /
        PPM; the levels below are one published reference point, not a guarantee.
      </Text>
      <Table className={classes.table} verticalSpacing={6} horizontalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>IEC 62676-4:2014 level</Table.Th>
            <Table.Th className={classes.number}>PPM</Table.Th>
            <Table.Th className={classes.number}>≈ PPF</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {densityGuidanceRows().map((row) => (
            <Table.Tr key={row.label}>
              <Table.Td>{row.label}</Table.Td>
              <Table.Td className={classes.number}>{row.ppm}</Table.Td>
              <Table.Td className={classes.number}>{row.ppf}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Text className={classes.note}>
        Source: IEC 62676-4:2014 (video surveillance systems, application guidelines). The 2025
        edition revises these levels, and other standards and specifications use different figures.
        Real results also depend on lighting, focus, lens quality, compression, motion and camera
        angle: no pixel density guarantees that a person or face can be recognised or identified.
      </Text>
    </div>
  );
}
