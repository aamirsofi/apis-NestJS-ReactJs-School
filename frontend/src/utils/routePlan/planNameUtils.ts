/**
 * Route Plan Name Generation Utilities
 */

export interface RoutePlanNameComponents {
  routeName?: string;
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
}

/**
 * Generate route plan name from components
 */
export function generateRoutePlanName(
  components: RoutePlanNameComponents
): string {
  const { routeName, feeCategoryName, categoryHeadName, className } = components;

  const baseName = routeName || "Route Price";
  const feeCategoryPart = feeCategoryName ? ` - ${feeCategoryName}` : ""; // Deprecated
  const categoryHeadPart = categoryHeadName ? ` - ${categoryHeadName}` : "";
  const classPart = className ? ` (${className})` : "";

  return `${baseName}${categoryHeadPart}${classPart}`;
}

/**
 * Generate route plan name from IDs (updated for route_prices - no feeCategoryId)
 */
export function generateRoutePlanNameFromIds(
  routeId: number,
  feeCategoryId: number | undefined, // Deprecated but kept for compatibility
  categoryHeadId: number | null | undefined,
  classId: number | null | undefined,
  routes: Array<{ id: number; name: string }>,
  feeCategories: Array<{ id: number; name: string }>, // Deprecated but kept for compatibility
  categoryHeads: Array<{ id: number; name: string }>,
  classes: Array<{ id: number; name: string }>
): string {
  const route = routes.find((r) => r.id === routeId);
  const categoryHead = categoryHeadId
    ? categoryHeads.find((ch) => ch.id === categoryHeadId)
    : null;
  const classItem = classId
    ? classes.find((cls) => cls.id === classId)
    : null;

  return generateRoutePlanName({
    routeName: route?.name,
    feeCategoryName: undefined, // No longer used for route_prices
    categoryHeadName: categoryHead?.name,
    className: classItem?.name,
  });
}

