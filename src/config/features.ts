export const FEATURE_FLAGS = {
  cart: true,
  exports: true,
  search: true,
  categories: true,
  mailto: true,
  pdf: true,
  csv: true,
};

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return Boolean(FEATURE_FLAGS[flag]);
}
