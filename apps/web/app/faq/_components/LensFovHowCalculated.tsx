import { List, Text } from '@mantine/core';
import classes from './FaqPage.module.css';

/** Plain-language explanation of the method, the pixel density levels and the limits, on the FAQ page. */
export function LensFovHowCalculated() {
  return (
    <>
      <List size="sm" spacing="xs">
        <List.Item>
          The lens is treated as <b>distortion-free</b> and aimed straight at a flat target. The
          angle of view is <i>2 × atan(sensor size ÷ 2 × focal length)</i>, and the width covered is{' '}
          <i>distance × sensor width ÷ focal length</i>.
        </List.Item>
        <List.Item>
          A sensor type such as 1/2.8&quot; names its <b>diagonal</b>, not its width. The active
          area is the rectangle with that diagonal in the image&apos;s shape.
        </List.Item>
        <List.Item>
          <b>Pixel density</b> is the image&apos;s width in pixels divided by the width covered at
          the target: pixels per foot (PPF) or per metre (PPM). Resolution changes the density, not
          the field of view.
        </List.Item>
        <List.Item>
          The <b>pixel density levels</b> in the coverage shading and the guidance table are IEC
          62676-4:2014&apos;s: Detection 25 PPM (7.6 PPF), Observation 62.5 PPM (19.1 PPF),
          Recognition 125 PPM (38.1 PPF) and Identification 250 PPM (76.2 PPF). A distance meets a
          level when its density reaches that figure. The 2025 edition revises these levels.
        </List.Item>
        <List.Item>
          Mounting height and tilt aren&apos;t modelled. Wide-angle lenses often have barrel
          distortion; where the datasheet gives a field of view, use that.
        </List.Item>
      </List>
      <Text mt="sm" className={classes.note}>
        Meeting a pixel density doesn&apos;t guarantee a person can be recognised or identified:
        lighting, focus, compression, motion and camera angle matter too.
      </Text>
    </>
  );
}
