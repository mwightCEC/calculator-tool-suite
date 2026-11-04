'use client';

import { useEffect, useRef, useState } from 'react';
import type { CableLengthUnit, LensFovResult } from '@cctv/calc-core';
import { Slider, Text } from '@mantine/core';
import {
  CLARITY_SCENE_URL,
  claritySlider,
  pixelsPerMetreAt,
  SCENE_WIDTH_M,
  scenePixels,
} from '../../_lib/clarity-scene';
import { formatDensity, formatLength } from '../../_lib/lens-fov-labels';
import classes from './Visuals.module.css';

const SLIDER_STEPS = 400;

interface ClaritySampleProps {
  result: LensFovResult;
  unit: CableLengthUnit;
}

/**
 * The drawn test scene in full detail beside the same scene at the pixels it would
 * get at a distance. Starts at the calculator's distance; the slider moves it.
 */
export function ClaritySample({ result, unit }: ClaritySampleProps) {
  const slider = claritySlider(result);
  const [distanceM, setDistanceM] = useState(result.distanceM);
  const pixelsPerMetre = pixelsPerMetreAt(result, distanceM);
  const pixels = scenePixels(pixelsPerMetre);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setScene(image);
    image.src = CLARITY_SCENE_URL;
  }, []);

  // Draw the scene into a canvas the size of its pixel count; CSS then enlarges it without smoothing.
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!scene || !context) {
      return;
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, pixels.width, pixels.height);
    context.drawImage(scene, 0, 0, pixels.width, pixels.height);
  }, [scene, pixels.width, pixels.height]);

  const step = (slider.max - slider.min) / SLIDER_STEPS;

  return (
    <div className={classes.clarity}>
      <div className={classes.clarityPanels}>
        <figure className={classes.clarityFigure}>
          <img
            src={CLARITY_SCENE_URL}
            alt="Test scene in full detail: a person, a sample licence plate and a sign"
            className={classes.clarityImage}
          />
          <figcaption>Full detail</figcaption>
        </figure>
        <figure className={classes.clarityFigure}>
          <canvas
            ref={canvasRef}
            width={pixels.width}
            height={pixels.height}
            className={classes.clarityImage}
            data-pixelated
            role="img"
            aria-label={`The same scene at ${formatLength(distanceM, unit)}: ${pixels.width} by ${pixels.height} pixels, ${formatDensity(pixelsPerMetre, unit)}.`}
          />
          <figcaption>
            At {formatLength(distanceM, unit)} · {formatDensity(pixelsPerMetre, unit)}
          </figcaption>
        </figure>
      </div>

      <Slider
        min={slider.min}
        max={slider.max}
        step={step}
        value={Math.min(Math.max(distanceM, slider.min), slider.max)}
        onChange={setDistanceM}
        label={(value) => formatLength(value, unit)}
        aria-label="Distance for the clarity sample"
      />
      <Text className={classes.note}>
        The {formatLength(SCENE_WIDTH_M, unit)} wide scene is {pixels.width} × {pixels.height}{' '}
        pixels here. An illustration of pixel density only, not a camera simulation: the lens,
        focus, lighting, compression and motion change real images too.
      </Text>
    </div>
  );
}
