import { WIRE_GAUGES, type WireGauge, type WireSystem } from './options';

/** Annealed copper (IACS) at 20 °C, in ohm·mm² per metre. */
export const COPPER_RESISTIVITY = 0.017241;

export interface WireGaugeSpec {
  gauge: WireGauge;
  system: WireSystem;
  /** Conductor cross-section, in mm². */
  areaMm2: number;
}

/** Cross-section of an AWG size from its defined diameter: 0.127 mm × 92^((36 − n) / 39). */
export function awgAreaMm2(awg: number): number {
  const diameterMm = 0.127 * 92 ** ((36 - awg) / 39);
  return (Math.PI / 4) * diameterMm ** 2;
}

function specFor(gauge: WireGauge): WireGaugeSpec {
  const [system, size] = gauge.split('-') as [WireSystem, string];
  const areaMm2 = system === 'awg' ? awgAreaMm2(Number(size)) : Number(size);
  return { gauge, system, areaMm2 };
}

export const WIRE_GAUGE_SPECS: readonly WireGaugeSpec[] = WIRE_GAUGES.map(specFor);

export function wireGaugeSpec(gauge: WireGauge): WireGaugeSpec {
  // WIRE_GAUGE_SPECS is built from WIRE_GAUGES, so every gauge has a spec.
  return WIRE_GAUGE_SPECS.find((spec) => spec.gauge === gauge) as WireGaugeSpec;
}

/** The sizes in one system, thinnest first. */
export function gaugesInSystem(system: WireSystem): WireGauge[] {
  return WIRE_GAUGE_SPECS.filter((spec) => spec.system === system).map((spec) => spec.gauge);
}

/** Resistance of one conductor, in ohms per metre. */
export function ohmsPerMetre(gauge: WireGauge): number {
  return COPPER_RESISTIVITY / wireGaugeSpec(gauge).areaMm2;
}

/** Resistance out and back along a two-conductor run, in ohms. */
export function loopOhms(gauge: WireGauge, lengthM: number): number {
  return 2 * lengthM * ohmsPerMetre(gauge);
}
