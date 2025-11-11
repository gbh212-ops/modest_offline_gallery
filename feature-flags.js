(function () {
  const defaults = {
    FEATURE_CART: true,
    FEATURE_EXPORTS: true,
    FEATURE_SEARCH: true,
    FEATURE_CATEGORIES: true,
  };

  const root = typeof window !== 'undefined' ? window : globalThis;
  const existing = (root && root.__GALLERY_FEATURES__) || {};
  const merged = Object.assign({}, defaults, existing);

  if (root) {
    root.__GALLERY_FEATURES__ = merged;
  }

  if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
    const EventConstructor = typeof CustomEvent === 'function' ? CustomEvent : null;
    if (EventConstructor) {
      document.dispatchEvent(new EventConstructor('gallery:features-ready', { detail: merged }));
    }
  }
})();
