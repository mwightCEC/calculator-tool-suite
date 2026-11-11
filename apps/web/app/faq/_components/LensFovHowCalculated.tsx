import { List, Text } from '@mantine/core';
import classes from './FaqPage.module.css';

/** Plain-language explanation of the method, the pixel density levels and the limits, on the FAQ page. */
export function LensFovHowCalculated() {
  return (
    <>
      <List size="sm" spacing="xs">
        <List.Item>
          The angle of view is <i>2 × atan(sensor size ÷ 2 × focal length)</i>; the width covered is{' '}
          <i>distance × sensor width ÷ focal length</i>. The lens is treated as distortion-free and
          aimed straight at a flat target; height and tilt aren&apos;t modelled. For wide-angle
          lenses, use the datasheet&apos;s field of view where given.
        </List.Item>
        <List.Item>
          A sensor type such as 1/2.8&quot; names its <b>diagonal</b>; the active area is that
          diagonal in the image&apos;s shape.
        </List.Item>
        <List.Item>
          <b>Pixel density</b> is image width in pixels ÷ width covered (PPF or PPM). Resolution
          changes the density, not the field of view.
        </List.Item>
        <List.Item>
          The pixel density levels are IEC 62676-4:2014&apos;s, listed in the calculator&apos;s
          Pixel density guidance. The 2025 edition revises them.
        </List.Item>
      </List>
      <Text mt="sm" className={classes.note}>
        Real results also depend on lighting, focus, lens quality, compression, motion and camera
        angle: no pixel density guarantees that a person or face can be recognised or identified.
      </Text>
    </>
  );
}
