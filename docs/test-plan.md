# Diagnostics Harness Manual Test Plan

Follow these steps after loading `index.html?debug=1` or `test-runner.html`.

## Search
1. Type a known style code into the search input.
2. Confirm only matching cards remain visible and the summary count reflects the filtered results.
3. Clear the field and ensure all styles return.

**Fails when:** results do not change, the count stays incorrect, or cards never return after clearing.

## Categories
1. Click any category chip and verify only matching items remain.
2. Activate a second category (if available) to ensure it toggles independently.
3. Use **Clear** to reset to the full gallery.

**Fails when:** chips are missing, selections do not filter, or Clear does not restore all items.

## Cart
1. Add two different styles to the cart; the badge should increment.
2. Open the cart drawer and confirm the selected items, quantities, and subtotal.
3. Refresh the page—the cart contents should persist.
4. Use **Clear cart** and ensure both the UI and badge reset.

**Fails when:** the badge stays at zero, items vanish on refresh, or the clear action leaves stale rows.

## CSV Export
1. Apply a filter so that at least one card remains.
2. Click **Export CSV** and open the downloaded file.
3. Confirm the header row (`Code,Title,Category`) and at least one data row.

**Fails when:** the download is empty, missing headers, or contains malformed columns.

## PDF / Print
1. Click **Print PDF** (or use the browser print shortcut while filters are applied).
2. Check the preview for the compact grid layout without toolbars or overlays.

**Fails when:** toolbar elements appear in print preview, or the grid does not reflow for printing.

## Mailto Share
1. Add at least one item to the cart.
2. Activate **Mail shortlist** and inspect the draft email.
3. Confirm the subject includes "Modest Bridal Cart" and the body lists each code on separate lines.

**Fails when:** the mail client does not open, subject/body are blank, or characters are unencoded.
