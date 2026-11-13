export const USER_ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROSPECT_STATUSES = [
  "DISCOVERED",
  "TO_REVIEW",
  "QUALIFIED",
  "CONTACT_PENDING",
  "CONTACTED",
  "REPLIED",
  "MEETING",
  "PROPOSAL",
  "WON",
  "LOST",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const ACTIVITY_TYPES = [
  "NOTE",
  "CALL",
  "EMAIL",
  "MEETING",
  "STATUS_CHANGE",
  "ASSIGNMENT",
  "OTHER",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const OPPORTUNITY_STAGES = [
  "IDENTIFIED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];
