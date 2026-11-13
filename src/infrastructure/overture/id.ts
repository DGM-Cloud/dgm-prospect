import { createHash } from "node:crypto";

/**
 * OsmPlace.osmId is BigInt. Overture GERS ids are UUIDs/strings, so we
 * derive a stable signed 63-bit integer and keep the original id in tags.
 */
export function overtureIdToStableBigInt(overtureId: string): string {
  const digest = createHash("sha256").update(`overture:${overtureId}`).digest();
  const value = digest.readBigUInt64BE(0) & BigInt("0x7fffffffffffffff");
  return value.toString();
}
