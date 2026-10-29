import {
  isBitrateModelValidated,
  LINK_CAUTION_ABOVE,
  LINK_OVER_CAPACITY_ABOVE,
} from '@cctv/calc-core';
import { List, Text } from '@mantine/core';

const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

/** Plain-language explanation of the method and its limits. */
export function HowCalculated() {
  return (
    <div>
      <List size="sm" spacing="xs">
        <List.Item>
          The <b>bandwidth estimate</b> adds up <i>bitrate × cameras</i> for every camera group,
          then adds the overhead allowance for network protocol headers and bursts.
        </List.Item>
        <List.Item>
          <b>Remote viewing bandwidth</b> is <i>viewers × cameras each × per-camera bitrate</i>,
          plus overhead. <b>Camera bitrate</b> uses the average bitrate per camera across all
          groups; <b>Custom bitrate</b> uses the value you enter, for example a sub-stream rate.
        </List.Item>
        <List.Item>
          Cameras stream continuously, so motion or schedule settings do not reduce network traffic.
        </List.Item>
        <List.Item>
          Real bitrate varies with the scene, night/IR noise, camera model and settings, so
          estimates are shown as a likely range. Use <b>VBR</b> or <b>CBR</b> with a known bitrate
          for firmer figures.
        </List.Item>
        <List.Item>
          Network checks compare the high end of the range with each link: up to{' '}
          {percent(LINK_CAUTION_ABOVE)} is OK, up to {percent(LINK_OVER_CAPACITY_ABOVE)} is a
          caution, and above that the link is treated as over capacity, leaving headroom for bursts
          and other traffic.
        </List.Item>
      </List>
      {!isBitrateModelValidated && (
        <Text size="sm" mt="sm" c="dimmed">
          The bitrate estimates currently use preliminary placeholder values that have not been
          validated against measured cameras.
        </Text>
      )}
    </div>
  );
}
