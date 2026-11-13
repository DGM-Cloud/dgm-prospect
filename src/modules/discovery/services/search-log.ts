/**
 * In-process recent search log for GET /discovery/searches.
 * Not durable across restarts — replace with DB when history becomes a product requirement.
 */

export type DiscoverySearchLogEntry = {
  id: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  categoryIds: string[];
  total: number;
  provider: string;
  createdAt: string;
};

class DiscoverySearchLog {
  private readonly entries: DiscoverySearchLogEntry[] = [];
  private readonly maxEntries = 50;

  add(
    entry: Omit<DiscoverySearchLogEntry, "id" | "createdAt">,
  ): DiscoverySearchLogEntry {
    const record: DiscoverySearchLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.entries.unshift(record);
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }
    return record;
  }

  list(limit = 20): DiscoverySearchLogEntry[] {
    return this.entries.slice(0, Math.min(50, Math.max(1, limit)));
  }
}

export const discoverySearchLog = new DiscoverySearchLog();
