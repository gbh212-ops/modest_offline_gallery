# Diagnostics Triage Checklist

Use this list when a feature fails either the automated diagnostics or the manual test plan.

## Quick Checks
- [ ] Confirm `manifest.json` loads (check DevTools Network tab) and returns an array of objects.
- [ ] Validate each manifest row includes `src` and that optional `code`/`title` strings are trimmed.
- [ ] Verify `feature-flags.js` exposes the expected booleans via `window.__GALLERY_FEATURES__`.
- [ ] Ensure the DOM still exposes the required `data-hook` selectors for toolbar, chips, cart, and export controls.
- [ ] Clear `localStorage['premium-gallery-cart']` to rule out corrupted cart state; re-run diagnostics afterward.
- [ ] Inspect `document.styleSheets` for a `@media print` block; missing rules break PDF readiness.
- [ ] Open the generated mailto link and confirm URL encoding is intact (long carts may exceed mail client limits).
- [ ] Check the console for `gallery:*` events firing (`manifest-loaded`, `visible-updated`, `cart-updated`).

## Network & Environment
- [ ] If offline, confirm images resolve from the `images/` directory with correct filenames.
- [ ] Disable browser extensions that might block `window.print()` or intercept `mailto:` links.

## Debug Hooks
- [ ] Use `window.__GALLERY_DEBUG__.getItems()` to inspect normalized data.
- [ ] Compare `getVisibleItems()` after search/category interactions to confirm AND filtering.
- [ ] Review `getCart()` to ensure quantities and items align with expectations.
- [ ] Check `getFlags()` when a feature appears hidden or disabled.

## Bug Report Template
```
### Summary
<one sentence describing the failure>

### Steps to Reproduce
1. 
2. 
3. 

### Expected Result

### Actual Result

### Diagnostics Output
- Overlay status: Pass/Fail counts
- Relevant console groups / stack traces

### Attachments
- Screenshots or CSV/PDF samples if available
```
