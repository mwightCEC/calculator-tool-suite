import { describe, expect, it } from 'vitest';
import { POE_CLASSES } from './options';
import {
  classForDeviceWatts,
  POE_CLASS_SPECS,
  poeClassSpec,
  portStandardMaxDeviceWatts,
} from './poe-classes';

describe('POE_CLASS_SPECS', () => {
  it('has one entry per class, indexed by class number', () => {
    expect(POE_CLASS_SPECS.map((spec) => spec.poeClass)).toEqual([...POE_CLASSES]);
  });

  it('never lets a device draw more than its switch allocation', () => {
    for (const spec of POE_CLASS_SPECS) {
      expect(spec.deviceWatts).toBeLessThan(spec.switchWatts);
    }
  });

  it('uses four pairs from class 5 up', () => {
    expect(POE_CLASS_SPECS.filter((spec) => spec.pairs === 4).map((spec) => spec.poeClass)).toEqual(
      [5, 6, 7, 8]
    );
  });
});

describe('poeClassSpec', () => {
  it.each([
    [3, 15.4, 12.95],
    [4, 30, 25.5],
    [8, 90, 71.3],
  ] as const)('class %d allocates %d W for %d W at the device', (poeClass, switchW, deviceW) => {
    expect(poeClassSpec(poeClass)).toEqual(
      expect.objectContaining({ switchWatts: switchW, deviceWatts: deviceW })
    );
  });
});

describe('portStandardMaxDeviceWatts', () => {
  it.each([
    ['af', 12.95],
    ['at', 25.5],
    ['bt-type3', 51],
    ['bt-type4', 71.3],
  ] as const)('%s ports power devices up to %d W', (standard, watts) => {
    expect(portStandardMaxDeviceWatts(standard)).toBe(watts);
  });
});

describe('classForDeviceWatts', () => {
  it.each([
    [3, 1],
    [3.84, 1],
    [3.85, 2],
    [6, 2],
    [12.95, 3],
    [13, 4],
    [25.6, 5],
    [71.3, 8],
  ])('%d W needs class %d', (watts, poeClass) => {
    expect(classForDeviceWatts(watts)).toBe(poeClass);
  });

  it('returns null above class 8', () => {
    expect(classForDeviceWatts(72)).toBeNull();
  });
});
