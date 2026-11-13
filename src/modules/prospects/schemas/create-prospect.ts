import { z } from "zod";

export const createProspectSchema = z.object({
  osmPlaceId: z.string().min(1),
  notes: z.string().max(5000).optional(),
});

export type CreateProspectBody = z.infer<typeof createProspectSchema>;
