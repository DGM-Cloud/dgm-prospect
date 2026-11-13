import { z } from "zod";
import { PROSPECT_STATUSES } from "@/shared/types/enums";

export const exportProspectsSchema = z.object({
  format: z.enum(["csv", "xlsx"]),
  campaignId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
});

export type ExportProspectsBody = z.infer<typeof exportProspectsSchema>;
