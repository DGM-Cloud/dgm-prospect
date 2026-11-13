import { z } from "zod";
import { OPPORTUNITY_STAGES } from "@/shared/types/enums";
import { DGM_SERVICES } from "@/shared/config/dgm-services";

const serviceIds = DGM_SERVICES.map((s) => s.id) as [string, ...string[]];

export const createOpportunitySchema = z.object({
  prospectId: z.string().min(1),
  service: z.enum(serviceIds),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  estimatedValue: z.number().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
});

export const updateOpportunitySchema = z
  .object({
    service: z.enum(serviceIds).optional(),
    stage: z.enum(OPPORTUNITY_STAGES).optional(),
    estimatedValue: z.number().nonnegative().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateOpportunityBody = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityBody = z.infer<typeof updateOpportunitySchema>;
