import { z } from "zod";
import { CAMPAIGN_STATUSES } from "@/shared/types/enums";

export const createCampaignSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  zoneLabel: z.string().max(200).optional(),
  categories: z.array(z.string().min(1)).max(20).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

export const updateCampaignSchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    zoneLabel: z.string().max(200).nullable().optional(),
    categories: z.array(z.string().min(1)).max(20).optional(),
    status: z.enum(CAMPAIGN_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const addCampaignProspectSchema = z.object({
  prospectId: z.string().min(1),
});

export type CreateCampaignBody = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignBody = z.infer<typeof updateCampaignSchema>;
