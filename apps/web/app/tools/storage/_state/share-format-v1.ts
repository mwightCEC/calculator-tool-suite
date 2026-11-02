/*
 * Share link format v1 (still read): the full state object as JSON.
 *
 * Its groups name the bitrate source as text. VBR ('known-average') and CBR
 * ('bitrate-cap') were later merged into Manual, so they are renamed here
 * before the state schema check.
 */

const OLD_ENTERED_SOURCES: ReadonlySet<unknown> = new Set(['known-average', 'bitrate-cap']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function migrateGroup(group: unknown): unknown {
  if (!isRecord(group) || !isRecord(group.bitrate)) {
    return group;
  }
  if (!OLD_ENTERED_SOURCES.has(group.bitrate.source)) {
    return group;
  }
  return { ...group, bitrate: { ...group.bitrate, source: 'manual' } };
}

/** Returns the v1 payload with old bitrate sources renamed; anything else is left for the schema. */
export function v1PayloadToState(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.cameraGroups)) {
    return payload;
  }
  return { ...payload, cameraGroups: payload.cameraGroups.map(migrateGroup) };
}
