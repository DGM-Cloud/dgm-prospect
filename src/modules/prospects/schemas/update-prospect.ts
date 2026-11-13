import { z } from "zod";
import { PROSPECT_STATUSES } from "@/shared/types/enums";

export const updateProspectSchema = z
  .object({
    businessName: z.string().min(1).max(300).optional(),
    category: z.string().max(120).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
    phone: z.string().max(80).nullable().optional(),
    email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    website: z.string().max(500).nullable().optional(),
    instagram: z.string().max(200).nullable().optional(),
    facebook: z.string().max(200).nullable().optional(),
    status: z.enum(PROSPECT_STATUSES).optional(),
    assignedToId: z.string().uuid().nullable().optional(),
    notes: z.string().max(10000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type UpdateProspectBody = z.infer<typeof updateProspectSchema>;
