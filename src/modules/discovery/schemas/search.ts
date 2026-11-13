import { z } from "zod";
import {
  BUSINESS_CATEGORIES,
  DISCOVERY_PROVIDERS,
  SEARCH_RADII_KM,
  type SearchRadiusKm,
} from "@/shared/config/business-categories";

const categoryIdSet = new Set(BUSINESS_CATEGORIES.map((c) => c.id));

export const discoverySearchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z
    .number()
    .refine(
      (value): value is SearchRadiusKm =>
        (SEARCH_RADII_KM as readonly number[]).includes(value),
      { message: "radiusKm must be one of 1, 3, 5, 10" },
    ),
  categoryIds: z
    .array(z.string().min(1))
    .min(1)
    .max(BUSINESS_CATEGORIES.length)
    .superRefine((ids, ctx) => {
      for (const id of ids) {
        if (!categoryIdSet.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown category: ${id}`,
          });
        }
      }
    }),
  provider: z.enum(DISCOVERY_PROVIDERS).optional().default("both"),
  persist: z.boolean().optional().default(true),
  enrichWebsiteSocials: z.boolean().optional().default(true),
});

export type DiscoverySearchBody = z.infer<typeof discoverySearchSchema>;
