import { z } from "zod";

export const createAnalysisSchema = z.object({
  prospectId: z.string().min(1),
  finding: z.string().min(3).max(5000),
  opportunity: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().max(200).optional(),
});

export type CreateAnalysisBody = z.infer<typeof createAnalysisSchema>;
