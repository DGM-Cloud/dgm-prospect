/**
 * JSON cannot serialize BigInt (e.g. OsmPlace.osmId). Convert recursively.
 */
export function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, current) =>
      typeof current === "bigint" ? current.toString() : current,
    ),
  ) as T;
}
