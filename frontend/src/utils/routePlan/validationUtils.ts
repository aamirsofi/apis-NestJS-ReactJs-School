/**
 * Validation Utilities for Route Plan Forms
 */

export interface RoutePlanFormData {
  schoolId: string | number;
  routeId: string | number;
  feeCategoryId?: string | number; // Optional/deprecated for route_prices
  categoryHeadId: string | number; // Required for route_prices
  amount: string;
  classId: string | number; // Required for route_prices
  status: "active" | "inactive";
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate school selection
 */
export function validateSchool(
  schoolId: string | number
): ValidationResult {
  const schoolIdNum =
    typeof schoolId === "string" ? parseInt(schoolId, 10) : schoolId;
  if (!schoolIdNum || schoolIdNum === 0 || isNaN(schoolIdNum)) {
    return { isValid: false, error: "Please select a school" };
  }
  return { isValid: true };
}

/**
 * Validate amount (0 is valid for some routes/fee plans)
 */
export function validateAmount(amount: string): ValidationResult {
  if (!amount || amount === "" || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
    return { isValid: false, error: "Please enter a valid amount" };
  }
  return { isValid: true };
}

/**
 * Validate route selection
 */
export function validateRoute(
  routeId: string | number
): ValidationResult {
  const routeIdNum =
    typeof routeId === "string"
      ? parseInt(routeId, 10)
      : routeId;
  if (
    !routeIdNum ||
    routeIdNum === 0 ||
    isNaN(routeIdNum)
  ) {
    return { isValid: false, error: "Please select a route" };
  }
  return { isValid: true };
}

/**
 * Validate transport fee category selection (deprecated for route_prices)
 */
export function validateTransportFeeCategory(
  feeCategoryId: string | number | undefined
): ValidationResult {
  // This is no longer required for route_prices, but kept for backward compatibility
  return { isValid: true };
}

/**
 * Validate category head selection (required for route_prices)
 */
export function validateCategoryHead(
  categoryHeadId: string | number | null | undefined
): ValidationResult {
  const categoryHeadIdNum =
    typeof categoryHeadId === "string"
      ? parseInt(categoryHeadId, 10)
      : categoryHeadId;
  if (
    !categoryHeadIdNum ||
    categoryHeadIdNum === 0 ||
    isNaN(categoryHeadIdNum)
  ) {
    return { isValid: false, error: "Please select a category head" };
  }
  return { isValid: true };
}

/**
 * Validate class selection
 */
export function validateClass(classId: string | number): ValidationResult {
  if (!classId) {
    return { isValid: false, error: "Please select a class" };
  }
  return { isValid: true };
}

/**
 * Validate form data for single mode (updated for route_prices)
 */
export function validateSingleModeRoutePlanForm(
  formData: RoutePlanFormData
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const routeValidation = validateRoute(formData.routeId);
  if (!routeValidation.isValid) return routeValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  const categoryHeadValidation = validateCategoryHead(formData.categoryHeadId);
  if (!categoryHeadValidation.isValid) return categoryHeadValidation;

  const classValidation = validateClass(formData.classId);
  if (!classValidation.isValid) return classValidation;

  return { isValid: true };
}

/**
 * Validate form data for multiple mode (updated for route_prices)
 */
export function validateMultipleModeRoutePlanForm(
  formData: RoutePlanFormData,
  selectedRouteIds: number[],
  selectedFeeCategoryIds: number[], // Deprecated but kept for compatibility
  selectedCategoryHeadIds: number[], // Added for route_prices
  selectedClasses: number[]
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  if (selectedRouteIds.length === 0) {
    return { isValid: false, error: "Please select at least one route" };
  }

  if (selectedCategoryHeadIds.length === 0) {
    return { isValid: false, error: "Please select at least one category head" };
  }

  if (selectedClasses.length === 0) {
    return { isValid: false, error: "Please select at least one class" };
  }

  return { isValid: true };
}

/**
 * Validate form data for edit mode (updated for route_prices)
 */
export function validateEditRoutePlanForm(
  formData: RoutePlanFormData
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const routeValidation = validateRoute(formData.routeId);
  if (!routeValidation.isValid) return routeValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  const categoryHeadValidation = validateCategoryHead(formData.categoryHeadId);
  if (!categoryHeadValidation.isValid) return categoryHeadValidation;

  const classValidation = validateClass(formData.classId);
  if (!classValidation.isValid) return classValidation;

  return { isValid: true };
}

