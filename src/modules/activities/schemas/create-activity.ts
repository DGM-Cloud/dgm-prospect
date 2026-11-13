import { z } from "zod";
import { ACTIVITY_TYPES } from "@/shared/types/enums";

export const createActivitySchema = z.object({
  prospectId: z.string().min(1),
  activityType: z.enum(ACTIVITY_TYPES).default("NOTE"),
  description: z.string().min(1).max(5000),
});

export type CreateActivityBody = z.infer<typeof createActivitySchema>;
