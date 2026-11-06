import { WIRE_GAUGES, type WireGauge, type WireSystem } from './options';

/** Annealed copper (IACS) at 20 °C, in ohm·mm² per metre. */
export const COPPER_RESISTIVITY = 0.017241;

export interface WireGaugeSpec {
  gauge: WireGauge;
  system: WireSystem;
  /** Conductor cross-section, in mm². */
  areaMm2: number;
  /** Resistance of one conductor at 20 °C, in ohms per kilometre. */
  ohmsPerKm: number;
}

/**
 * IEC 60228 maximum resistance of class 5 (flexible) plain copper conductors at
 * 20 °C, in ohms per kilometre. Metric cable is sold to these limits, which sit
 * 5–15% above the nominal cross-section's resistance, so the drop isn't understated.
 */
export const IEC_60228_CLASS_5_OHMS_PER_KM: Record<string, number> = {
  '0.5': 39.0,
  '0.75': 26.0,
  '1': 19.5,
  '1.5': 13.3,
  '2.5': 7.98,
  '4': 4.95,
  '6': 3.3,
};

/** Cross-section of an AWG size from its defined diameter: 0.127 mm × 92^((36 − n) / 39). */
export function awgAreaMm2(awg: number): number {
  const diameterMm = 0.127 * 92 ** ((36 - awg) / 39);
  return (Math.PI / 4) * diameterMm ** 2;
}

/**
 * AWG sizes take copper's resistivity over the gauge's defined cross-section;
 * metric sizes take the IEC 60228 class 5 maximum.
 */
function specFor(gauge: WireGauge): WireGaugeSpec {
  const [system, size] = gauge.split('-') as [WireSystem, string];
  if (system === 'awg') {
    const areaMm2 = awgAreaMm2(Number(size));
    return { gauge, system, areaMm2, ohmsPerKm: (COPPER_RESISTIVITY / areaMm2) * 1000 };
  }
  // Every metric size in WIRE_GAUGES has an entry in the table.
  const ohmsPerKm = IEC_60228_CLASS_5_OHMS_PER_KM[size] as number;
  return { gauge, system, areaMm2: Number(size), ohmsPerKm };
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
  return wireGaugeSpec(gauge).ohmsPerKm / 1000;
}

/** Resistance out and back along a two-conductor run, in ohms. */
export function loopOhms(gauge: WireGauge, lengthM: number): number {
  return 2 * lengthM * ohmsPerMetre(gauge);
}

/**
 * The size in `system` closest to `gauge` by cross-section (compared as a
 * ratio), e.g. 18 AWG → 0.75 mm². A gauge already in `system` is kept.
 */
export function equivalentGauge(gauge: WireGauge, system: WireSystem): WireGauge {
  const area = wireGaugeSpec(gauge).areaMm2;
  const distance = (candidate: WireGauge) =>
    Math.abs(Math.log(wireGaugeSpec(candidate).areaMm2 / area));
  return gaugesInSystem(system).reduce((best, candidate) =>
    distance(candidate) < distance(best) ? candidate : best
  );
}
