import { PALETTE } from "./chartColors";

// Canonical 4-state WhatsApp engagement vocabulary used across the entire
// Agent Zone page. Same label, same colour, every visual.
export const ENGAGEMENT_STATES = [
  "Not Yet Messaged",
  "Sent",
  "Read",
  "Clicked",
] as const;

export type EngagementState = (typeof ENGAGEMENT_STATES)[number];

export const ENGAGEMENT_COLORS: Record<EngagementState, string> = {
  "Not Yet Messaged": PALETTE.grey,
  Sent: PALETTE.blue,
  Read: PALETTE.sage,
  Clicked: PALETTE.gold,
};

// Map any raw wa_engagement_status value to one of the four canonical states.
export function toEngagementState(raw: string | null | undefined): EngagementState {
  const v = raw?.trim().toLowerCase() ?? "";
  if (v === "clicked" || v === "replied" || v === "contacted") return "Clicked";
  if (v === "read") return "Read";
  if (v === "sent" || v === "failed") return "Sent";
  // never_sent, uncontacted, homeowner, null/empty, unknown -> Not Yet Messaged
  return "Not Yet Messaged";
}
