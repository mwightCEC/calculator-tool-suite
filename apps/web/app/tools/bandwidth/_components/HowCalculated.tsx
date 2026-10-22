import {
  isBitrateModelValidated,
  isSubStreamModelValidated,
  LINK_CAUTION_ABOVE,
  LINK_OVER_CAPACITY_ABOVE,
} from '@cctv/calc-core';
import { Accordion, List, Text } from '@mantine/core';

const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

/** Plain-language explanation of the method and its limits. */
export function HowCalculated() {
  return (
    <Accordion variant="contained" radius="md">
      <Accordion.Item value="how">
        <Accordion.Control>How this is calculated</Accordion.Control>
        <Accordion.Panel>
          <List size="sm" spacing="xs">
            <List.Item>
              <b>Recorder ingest</b> adds up <i>bitrate × cameras</i> for every group&apos;s main
              stream, plus the sub-streams when they are recorded, then adds the overhead allowance
              for network protocol headers and bursts.
            </List.Item>
            <List.Item>
              <b>Remote viewing upload</b> is <i>viewers × cameras each × per-camera bitrate</i>,
              plus overhead. The per-camera bitrate is the busiest group&apos;s for the chosen
              stream, so mixed systems are not underestimated.
            </List.Item>
            <List.Item>
              Recording mode does not change network traffic: cameras stream to the recorder
              continuously, and motion or schedule recording only changes what is written to disk.
            </List.Item>
            <List.Item>
              Real bitrate varies with the scene, night/IR noise, camera model and settings, so
              estimates are shown as a likely range. Use a <b>Known average</b> or a{' '}
              <b>Bitrate cap</b> for firmer figures.
            </List.Item>
            <List.Item>
              Network checks compare the high end of the range with each link: up to{' '}
              {percent(LINK_CAUTION_ABOVE)} is OK, up to {percent(LINK_OVER_CAPACITY_ABOVE)} is a
              caution, and above that the link is treated as over capacity, leaving headroom for
              bursts and other traffic.
            </List.Item>
          </List>
          {!(isBitrateModelValidated && isSubStreamModelValidated) && (
            <Text size="sm" mt="sm" c="dimmed">
              The bitrate and sub-stream estimates currently use preliminary placeholder values that
              have not been validated against measured cameras.
            </Text>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
