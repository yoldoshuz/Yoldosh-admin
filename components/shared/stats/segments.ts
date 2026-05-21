import type { CountsPair, OverviewSegments, Pair, SegmentBlock, UserSegment } from "@/types";

/** Resolve a `{ total, totalInRange }` pair from a `CountsPair` by segment key. */
export const pickSegmentPair = (counts: CountsPair | undefined, segment: UserSegment): Pair | undefined => {
  if (!counts) return undefined;
  if (segment === "guests") return undefined; // guests live in their own counter
  const total = counts.total?.[segment] ?? 0;
  const totalInRange = counts.totalInRange?.[segment] ?? 0;
  return { total, totalInRange };
};

/** Resolve a `SegmentBlock` from overview.segments by segment key. */
export const pickSegmentBlock = (
  segments: OverviewSegments | undefined,
  segment: UserSegment
): SegmentBlock | undefined => {
  if (!segments) return undefined;
  const block = segments[segment];
  if (!block) return undefined;
  // Guests block has no drivers/passengers — normalise to SegmentBlock shape.
  if (segment === "guests") {
    return { total: block.total, totalInRange: block.totalInRange };
  }
  return block as SegmentBlock;
};
