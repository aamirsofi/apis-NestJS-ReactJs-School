/**
 * Duplicate Detection Utilities for Route Plans
 */

import { RoutePlan, RoutePrice } from "../../types";
import { RoutePlanCombination } from "./combinationUtils";

/**
 * Check if a combination already exists in route prices (updated for route_prices)
 */
export function isRoutePlanDuplicate(
  combination: RoutePlanCombination,
  existingRoutePlans: RoutePrice[] | RoutePlan[]
): boolean {
  return existingRoutePlans.some((plan) => {
    const routeMatch = plan.routeId === combination.routeId;
    // feeCategoryId is no longer used for route_prices
    const categoryHeadMatch = plan.categoryHeadId === combination.categoryHeadId;
    const classMatch = plan.classId === combination.classId;

    return routeMatch && categoryHeadMatch && classMatch;
  });
}

/**
 * Filter out duplicate combinations (updated for route_prices)
 */
export function filterRoutePlanDuplicates(
  combinations: RoutePlanCombination[],
  existingRoutePlans: RoutePrice[] | RoutePlan[]
): RoutePlanCombination[] {
  return combinations.filter(
    (combo) => !isRoutePlanDuplicate(combo, existingRoutePlans)
  );
}

/**
 * Find duplicate route price (updated for route_prices)
 */
export function findRoutePlanDuplicate(
  combination: RoutePlanCombination,
  existingRoutePlans: RoutePrice[] | RoutePlan[]
): RoutePrice | RoutePlan | undefined {
  return existingRoutePlans.find((plan) => {
    const routeMatch = plan.routeId === combination.routeId;
    const categoryHeadMatch = plan.categoryHeadId === combination.categoryHeadId;
    const classMatch = plan.classId === combination.classId;

    return routeMatch && categoryHeadMatch && classMatch;
  });
}

