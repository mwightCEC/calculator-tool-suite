import type { DoriLevel, LensFovResult } from '@cctv/calc-core';

/*
 * The clarity sample: a drawn test scene of known real-world size, shown at the
 * pixels it would get at a distance. An illustration of pixel density only:
 * real images also depend on the lens, focus, lighting, compression and motion.
 */

/** The scene's real-world size, in metres: a 6 ft person, a licence plate and a sign. */
export const SCENE_WIDTH_M = 2.4;
export const SCENE_HEIGHT_M = 2;

/** Above this many pixels across, the reduced copy looks the same as the full drawing. */
export const MAX_SCENE_PIXELS = 1200;

/**
 * The test scene in centimetres (1 unit = 1 cm), drawn to scale. It is an image,
 * like a photo, so its colours are fixed rather than theme tokens. Everything in it
 * is made up: the person is a drawing and the plate text isn't a real registration.
 */
export const CLARITY_SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="960" height="800" font-family="Arial, Helvetica, sans-serif">
  <rect width="240" height="200" fill="#e7ecf1"/>
  <rect y="186" width="240" height="14" fill="#b9c0c8"/>
  <rect x="0" y="0" width="240" height="4" fill="#cfd6dd"/>

  <!-- Drawn 175 cm from hair to sole, scaled about the feet to 183 cm (6 ft). -->
  <g id="person" transform="translate(56 187) scale(1.046) translate(-56 -187)">
    <rect x="46" y="98" width="9" height="88" rx="3" fill="#2e3a4f"/>
    <rect x="58" y="98" width="9" height="88" rx="3" fill="#2e3a4f"/>
    <rect x="44" y="182" width="12" height="5" rx="2" fill="#1d1d1d"/>
    <rect x="57" y="182" width="12" height="5" rx="2" fill="#1d1d1d"/>
    <path d="M40 46 Q56 40 72 46 L75 102 L37 102 Z" fill="#c4473a"/>
    <rect x="31" y="47" width="8" height="50" rx="4" fill="#c4473a"/>
    <rect x="73" y="47" width="8" height="50" rx="4" fill="#c4473a"/>
    <circle cx="35" cy="99" r="4" fill="#e0b48f"/>
    <circle cx="77" cy="99" r="4" fill="#e0b48f"/>
    <rect x="61" y="56" width="10" height="6" fill="#ffffff"/>
    <text x="66" y="60.5" font-size="3.6" text-anchor="middle" fill="#1d1d1d">STAFF</text>
    <rect x="52" y="37" width="8" height="8" fill="#e0b48f"/>
    <ellipse cx="56" cy="26" rx="10" ry="12" fill="#e0b48f"/>
    <path d="M46 24 Q46 12 56 12 Q66 12 66 24 Q62 17 56 17 Q50 17 46 24 Z" fill="#4a3424"/>
    <ellipse cx="52" cy="25" rx="1.6" ry="1.1" fill="#1d1d1d"/>
    <ellipse cx="60" cy="25" rx="1.6" ry="1.1" fill="#1d1d1d"/>
    <path d="M49.5 22 L54 21.5 M58 21.5 L62.5 22" stroke="#4a3424" stroke-width="0.8"/>
    <path d="M56 26 L55 30 L57 30" stroke="#a87a5a" stroke-width="0.7" fill="none"/>
    <path d="M52.5 33 Q56 35 59.5 33" stroke="#8a3b32" stroke-width="0.9" fill="none"/>
    <rect x="44.5" y="23" width="2" height="5" rx="1" fill="#d6a27e"/>
    <rect x="65.5" y="23" width="2" height="5" rx="1" fill="#d6a27e"/>
  </g>

  <g id="plate">
    <rect x="114" y="150" width="4" height="36" fill="#6b737c"/>
    <rect x="100.75" y="128" width="30.5" height="15.2" rx="1.5" fill="#ffffff" stroke="#1d3c6e" stroke-width="0.8"/>
    <text x="116" y="131.6" font-size="2.4" text-anchor="middle" fill="#1d3c6e">SAMPLE STATE</text>
    <text x="116" y="140.4" font-size="7.4" font-weight="700" text-anchor="middle" fill="#1d3c6e">ABC 1234</text>
    <text x="116" y="142.6" font-size="1.6" text-anchor="middle" fill="#1d3c6e">NOT A REAL PLATE</text>
    <rect x="100" y="143.2" width="32" height="7" fill="#6b737c"/>
  </g>

  <g id="sign">
    <rect x="152" y="16" width="80" height="96" rx="2" fill="#ffffff" stroke="#3b4652" stroke-width="1"/>
    <rect x="152" y="16" width="80" height="22" rx="2" fill="#1f7a3a"/>
    <text x="192" y="33" font-size="15" font-weight="700" text-anchor="middle" fill="#ffffff">EXIT</text>
    <text x="192" y="51" font-size="8" font-weight="700" text-anchor="middle" fill="#1d1d1d">GATE 3</text>
    <text x="192" y="62" font-size="5" text-anchor="middle" fill="#1d1d1d">Visitors sign in</text>
    <text x="192" y="70" font-size="3" text-anchor="middle" fill="#1d1d1d">Deliveries: rear dock, 7 am – 4 pm</text>
    <text x="192" y="76" font-size="2" text-anchor="middle" fill="#1d1d1d">This area is monitored by CCTV for safety and security.</text>
    <g fill="#1d1d1d">
      <rect x="160" y="84" width="4" height="20"/><rect x="168" y="84" width="4" height="20"/><rect x="176" y="84" width="4" height="20"/>
      <rect x="186" y="84" width="2" height="20"/><rect x="190" y="84" width="2" height="20"/><rect x="194" y="84" width="2" height="20"/>
      <rect x="202" y="84" width="1" height="20"/><rect x="204" y="84" width="1" height="20"/><rect x="206" y="84" width="1" height="20"/>
      <rect x="213" y="84" width="0.5" height="20"/><rect x="214" y="84" width="0.5" height="20"/><rect x="215" y="84" width="0.5" height="20"/>
    </g>
    <rect x="190" y="112" width="4" height="74" fill="#6b737c"/>
  </g>
</svg>`;

/** The scene as an image source. */
export const CLARITY_SCENE_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CLARITY_SCENE_SVG)}`;

/** Horizontal pixel density at another distance: it falls in proportion to the distance. */
export function pixelsPerMetreAt(result: LensFovResult, distanceM: number): number {
  return (result.pixelsPerMetre * result.distanceM) / distanceM;
}

/** How many image pixels the scene covers at a density (at least 1, capped where it stops showing). */
export function scenePixels(pixelsPerMetre: number): { width: number; height: number } {
  const across = (metres: number) =>
    Math.max(1, Math.min(MAX_SCENE_PIXELS, Math.round(metres * pixelsPerMetre)));
  return { width: across(SCENE_WIDTH_M), height: across(SCENE_HEIGHT_M) };
}

export interface ClaritySlider {
  /** Range in metres. */
  min: number;
  max: number;
  /** Where each DORI level stops, in metres, nearest (Identification) first. */
  marks: { level: DoriLevel; distanceM: number }[];
}

/**
 * The distance slider runs from close in to past Detection's reach (and past the
 * calculator's distance, when that is farther), with a mark where each level stops.
 */
export function claritySlider(result: LensFovResult): ClaritySlider {
  const marks = [...result.doriDistances]
    .reverse()
    .map(({ level, distanceM }) => ({ level, distanceM }));
  const farthest = Math.max(...marks.map((mark) => mark.distanceM), result.distanceM);
  const max = farthest * 1.25;
  return { min: max / 100, max, marks };
}
