import type { ManualOverride, PhaseStatus } from "@/lib/domain/types";

export function effectiveStatus(
  opensAt: string | null,
  closesAt: string | null,
  override: ManualOverride,
  now = new Date(),
): PhaseStatus {
  if (override) {
    return override;
  }

  if (!opensAt) {
    return "locked";
  }

  const openDate = new Date(opensAt);
  if (now < openDate) {
    return "locked";
  }

  if (closesAt) {
    const closeDate = new Date(closesAt);
    if (now >= closeDate) {
      return "closed";
    }
  }

  return "open";
}
