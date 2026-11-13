const SOCIAL_HOST_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/gi;

const OSM_SOCIAL_KEYS = [
  "contact:facebook",
  "contact:instagram",
  "contact:twitter",
  "contact:linkedin",
  "contact:youtube",
  "contact:tiktok",
  "contact:whatsapp",
  "facebook",
  "instagram",
] as const;

function normalizeSocialUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/[),.;]+$/g, "");
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.includes(".")) {
    return `https://${trimmed.replace(/^\/\//, "")}`;
  }
  return null;
}

export function collectSocials(input: {
  tags?: Record<string, string>;
  socialsField?: unknown;
}): string[] {
  const found = new Set<string>();

  const push = (value: unknown) => {
    if (typeof value === "string") {
      const normalized = normalizeSocialUrl(value);
      if (normalized) {
        found.add(normalized);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        push(item);
      }
    }
  };

  push(input.socialsField);

  const tags = input.tags ?? {};
  for (const key of OSM_SOCIAL_KEYS) {
    if (tags[key]) {
      push(tags[key]);
    }
  }
  if (tags.social) {
    push(tags.social);
  }
  if (tags.socials) {
    try {
      const parsed = JSON.parse(tags.socials) as unknown;
      push(parsed);
    } catch {
      push(tags.socials);
    }
  }

  return [...found];
}

export function extractSocialsFromHtml(html: string): string[] {
  const matches = html.match(SOCIAL_HOST_RE) ?? [];
  const found = new Set<string>();
  for (const match of matches) {
    const normalized = normalizeSocialUrl(match);
    if (normalized) {
      found.add(normalized.split("?")[0] ?? normalized);
    }
  }
  return [...found];
}

export function socialPlatformLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("facebook") || lower.includes("fb.com")) return "Facebook";
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("twitter") || lower.includes("x.com")) return "X";
  if (lower.includes("whatsapp") || lower.includes("wa.me")) return "WhatsApp";
  return "Red social";
}
