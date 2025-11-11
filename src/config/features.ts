export type GalleryFeatureFlags = {
  FEATURE_CART: boolean;
  FEATURE_EXPORTS: boolean;
  FEATURE_SEARCH: boolean;
  FEATURE_CATEGORIES: boolean;
};

export const FEATURE_CART = true;
export const FEATURE_EXPORTS = true;
export const FEATURE_SEARCH = true;
export const FEATURE_CATEGORIES = true;

export const FEATURE_FLAGS: GalleryFeatureFlags = {
  FEATURE_CART,
  FEATURE_EXPORTS,
  FEATURE_SEARCH,
  FEATURE_CATEGORIES,
};

export function resolveFeatureFlags(
  overrides: Partial<GalleryFeatureFlags> | null | undefined,
): GalleryFeatureFlags {
  return {
    FEATURE_CART: overrides?.FEATURE_CART ?? FEATURE_CART,
    FEATURE_EXPORTS: overrides?.FEATURE_EXPORTS ?? FEATURE_EXPORTS,
    FEATURE_SEARCH: overrides?.FEATURE_SEARCH ?? FEATURE_SEARCH,
    FEATURE_CATEGORIES: overrides?.FEATURE_CATEGORIES ?? FEATURE_CATEGORIES,
  };
}

if (typeof window !== 'undefined') {
  const existing = (window as unknown as { __GALLERY_FEATURES__?: Partial<GalleryFeatureFlags> }).__GALLERY_FEATURES__;
  const merged = resolveFeatureFlags(existing ?? undefined);
  (window as unknown as { __GALLERY_FEATURES__: GalleryFeatureFlags }).__GALLERY_FEATURES__ = merged;
}
