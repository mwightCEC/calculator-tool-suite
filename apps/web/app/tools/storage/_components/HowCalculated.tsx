import { isBitrateModelValidated } from '@cctv/calc-core';
import { Accordion, List, Text } from '@mantine/core';

/** Plain-language explanation of the method and its limits. */
export function HowCalculated() {
  return (
    <Accordion variant="contained" radius="md">
      <Accordion.Item value="how">
        <Accordion.Control>How this is calculated</Accordion.Control>
        <Accordion.Panel>
          <List size="sm" spacing="xs">
            <List.Item>
              Each group writes <i>bitrate × cameras × recorded hours</i> per day. Storage needed is
              daily footage × retention days, plus the reserve.
            </List.Item>
            <List.Item>
              Real camera bitrate varies a lot with the scene (foliage, traffic, crowds, rain),
              night/IR noise, camera model and settings. Estimates are therefore shown as a likely
              range, and the recommended drives are sized for the high end, because running out of
              storage is worse than having spare.
            </List.Item>
            <List.Item>
              For the most reliable results use a <b>VBR</b> average measured on an existing system,
              or the <b>CBR</b> (constant or maximum) bitrate configured on the cameras.
            </List.Item>
            <List.Item>
              RAID parity or mirroring and the reserve are taken out of raw capacity before footage
              is counted.
            </List.Item>
            <List.Item>
              Capacities use decimal TB (10¹² bytes) as printed on drives. Recorders and operating
              systems often display binary units, so the same drive can appear about 9% smaller.
            </List.Item>
          </List>
          {!isBitrateModelValidated && (
            <Text size="sm" mt="sm" c="dimmed">
              The bitrate estimates currently use preliminary placeholder values that have not been
              validated against measured cameras.
            </Text>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
