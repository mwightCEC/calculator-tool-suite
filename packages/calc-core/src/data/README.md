# Bitrate model data

`bitrate-model.json` holds every coefficient used to estimate camera bitrate.
Updating the numbers requires **no code changes**: the file is validated against
the Zod schema in `../bitrate/bitrate-model-schema.ts` when it is loaded and in tests.

> **Status: placeholder.** The current values come from the prototype and are not
> validated. Real-world bitrate varies widely with scene content, night/IR noise,
> encoder and camera settings, so even validated figures are planning estimates.

## Model

```
typical Mbps = baselineMbps[resolution]                 (H.264, 30 fps, medium complexity)
             × codecMultipliers[codec]
             × (fps / reference.frameRate) ^ frameRateScaling.exponent
             × sceneComplexityMultipliers[complexity]

low  = typical × (1 − band)
high = typical × (1 + band)
band = uncertaintyBand.bySceneComplexity[complexity] ?? uncertaintyBand.default
```

`nightIrMultiplier` is reserved for a future night/IR adjustment and is unused today
(`null`).

## Provenance

Every value carries a `provenance` string saying where it came from, for example:

- `placeholder`
- `measured: CE-VX80ARS5C, busy lobby, 2026-11-02`
- `engineering: factory default main stream, H.265`

## Replacing the placeholders

1. Gather typical bitrates, either from engineering/factory default stream settings
   or by recording each camera for 24+ hours in reference scenes (quiet indoor, busy
   area, outdoor foliage/traffic, including night/IR) and reading the NVR average.
2. Update each `value` and its `provenance`, and add entries to `sources`.
3. Bump `version`, set `lastUpdated`, and set `status` to `"validated"`.
   The schema rejects `"validated"` while any value is still marked `placeholder`.
4. Run `pnpm test`.
