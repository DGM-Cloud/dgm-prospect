import { extractSocialsFromHtml } from "./socials";

const MAX_ENRICH = 12;
const TIMEOUT_MS = 3500;

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "DGM-Prospect/0.1 (+local discovery enrichment)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xml")) {
      return null;
    }
    const text = await response.text();
    return text.slice(0, 400_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * When Overture/OSM has a website but no socials, lightly scan the homepage
 * for public social profile links. Caps concurrency and count per search.
 */
export async function enrichSocialsFromWebsites(
  items: Array<{ key: string; website: string | null; socials: string[] }>,
): Promise<Map<string, string[]>> {
  const targets = items
    .filter(
      (item) =>
        item.website?.trim() &&
        item.socials.length === 0 &&
        /^https?:\/\//i.test(item.website),
    )
    .slice(0, MAX_ENRICH);

  const results = new Map<string, string[]>();
  const queue = [...targets];
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next?.website) {
        continue;
      }
      const html = await fetchHtml(next.website);
      if (!html) {
        continue;
      }
      const socials = extractSocialsFromHtml(html);
      if (socials.length > 0) {
        results.set(next.key, socials);
      }
    }
  });

  await Promise.all(workers);
  return results;
}
