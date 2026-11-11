import { isBitrateModelValidated } from '@cctv/calc-core';
import { List, Text } from '@mantine/core';

/** The bitrate point Storage and Bandwidth share, worded once so the two sections match. */
export function BitrateRangeItem() {
  return (
    <List.Item>
      Real bitrate varies with the scene, night/IR noise and camera settings, so estimates are a
      range. For firm figures, choose <b>Manual</b> and enter the cameras&apos; measured or
      configured bitrate.
    </List.Item>
  );
}

/** Under Storage and Bandwidth while the bitrate model is unvalidated, as on their results cards. */
export function PreliminaryBitrateText() {
  return isBitrateModelValidated ? null : (
    <Text size="sm" mt="sm" c="dimmed">
      Bitrate estimates are preliminary and not yet checked against measured cameras.
    </Text>
  );
}
