/**
 * Combination Generation Utilities for Route Plan Bulk Creation
 */

export interface RoutePlanCombination {
  routeId: number;
  feeCategoryId?: number; // Deprecated for route_prices
  categoryHeadId: number; // Required for route_prices
  classId: number;
}

/**
 * Generate all combinations from selected items (updated for route_prices)
 */
export function generateRoutePlanCombinations(
  routeIds: number[],
  feeCategoryIds: number[], // Deprecated but kept for compatibility
  categoryHeadIds: number[], // Required for route_prices
  classIds: number[]
): RoutePlanCombination[] {
  const combinations: RoutePlanCombination[] = [];

  // Category heads are required for route_prices (no null allowed)
  if (categoryHeadIds.length === 0) {
    return []; // Cannot generate combinations without category heads
  }

  routeIds.forEach((routeId) => {
    categoryHeadIds.forEach((categoryHeadId) => {
      classIds.forEach((classId) => {
        combinations.push({
          routeId,
          categoryHeadId,
          classId,
        });
      });
    });
  });

  return combinations;
}

/**
 * Calculate total combinations that will be created
 */
export function calculateTotalRoutePlanCombinations(
  routeCount: number,
  feeCategoryCount: number,
  categoryHeadCount: number,
  classCount: number
): number {
  const effectiveCategoryHeadCount = categoryHeadCount > 0 ? categoryHeadCount : 1;
  return routeCount * feeCategoryCount * effectiveCategoryHeadCount * classCount;
}

