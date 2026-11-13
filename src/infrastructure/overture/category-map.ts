import type { BusinessCategoryConfig } from "@/shared/config/business-categories";

export function collectOvertureCategoryValues(
  categories: BusinessCategoryConfig[],
): string[] {
  const values = new Set<string>();
  for (const category of categories) {
    for (const value of category.overtureCategories) {
      values.add(value.toLowerCase());
    }
  }
  return [...values];
}

export function resolveDgmCategoryLabel(
  overtureCategory: string | null,
  categories: BusinessCategoryConfig[],
): string | null {
  if (!overtureCategory) {
    return null;
  }
  const normalized = overtureCategory.toLowerCase();
  for (const category of categories) {
    if (
      category.overtureCategories.some(
        (value) => value.toLowerCase() === normalized,
      )
    ) {
      return category.label;
    }
  }
  return null;
}
