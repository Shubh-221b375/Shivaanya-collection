export const RETURN_POLICY_WINDOW_DAYS = 7;

export const RETURN_POLICY_HEADLINE = `Returns & exchanges within ${RETURN_POLICY_WINDOW_DAYS} days`;

export const RETURN_POLICY_INTRO =
  "You may request a return or exchange within 7 days of delivery. To be eligible, all of the following must apply:";

/** Conditions that must be met for a return or exchange to be approved. */
export const RETURN_POLICY_ELIGIBILITY = [
  "Record a continuous unboxing video while opening the parcel — required before we can approve a return or exchange.",
  "Keep all original tags and labels attached; do not remove tags.",
  "The item must be unused, unworn, and free of stains, damage, or any external wear.",
] as const;
