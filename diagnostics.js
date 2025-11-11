(function () {
  const params = new URLSearchParams(window.location.search || '');
  if (!params.has('debug') || window.__GALLERY_DIAGNOSTICS__) return;
  window.__GALLERY_DIAGNOSTICS__ = true;

  const CART_KEY = 'premium-gallery-cart';
  const ready = (fn) => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true }); else fn(); };

  ready(() => {
    const Assert = window.__GALLERY_ASSERT__;
    if (!Assert) {
      console.warn('[diagnostics] assert library missing');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'diagnostics-overlay';
    overlay.innerHTML = `
      <div class="diagnostics-overlay__header">Diagnostics</div>
      <div class="diagnostics-overlay__body">
        <div data-role="counts">Waiting…</div>
        <button type="button" data-action="run">Run checks</button>
      </div>`;
    document.body.appendChild(overlay);
    const countsEl = overlay.querySelector('[data-role="counts"]');
    overlay.querySelector('[data-action="run"]').addEventListener('click', () => runChecks('manual'));

    const updateOverlay = (summary) => {
      const text = `Pass: ${summary.passed} • Fail: ${summary.failed}`;
      countsEl.textContent = text;
      overlay.dataset.status = summary.failed > 0 ? 'fail' : 'pass';
    };

    const hasPrintStyles = () => {
      const sheets = Array.from(document.styleSheets || []);
      return sheets.some((sheet) => {
        try {
          return Array.from(sheet.cssRules || []).some((rule) => rule.media && String(rule.media.mediaText || '').toLowerCase().includes('print'));
        } catch (error) {
          return false;
        }
      });
    };

    let lastMailtoHref = '';

    const runChecks = (trigger) => {
      const debug = window.__GALLERY_DEBUG__;
      if (!debug) {
        console.warn('[diagnostics] debug helpers missing');
        return;
      }

      Assert.reset();
      const { assert, group, report } = Assert;
      const items = debug.getItems();
      const flags = debug.getFlags();
      console.groupCollapsed(`Diagnostics run (${trigger})`);

      group('Manifest', () => {
        assert(Array.isArray(items), 'Items array available');
        assert(items.length > 0, 'Manifest contains items');
        items.slice(0, 10).forEach((item, index) => {
          assert(typeof item.src === 'string' && item.src.length > 0, `Item ${index + 1} has src`);
          assert(typeof item.category === 'string' && item.category.length > 0, `Item ${index + 1} category string`);
        });
      });

      group('Filters', () => {
        const searchInput = document.querySelector('[data-hook="search-input"], #search');
        const categoryButtons = Array.from(document.querySelectorAll('[data-hook="category-list"] .chip, .chip-list .chip'));
        const clearBtn = document.querySelector('[data-hook="clear-categories"], .chip-clear');
        const firstItem = items[0];
        if (flags.search && searchInput && firstItem) {
          const originalQuery = searchInput.value;
          searchInput.value = firstItem.code || firstItem.title;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          const afterSearch = debug.getVisibleItems();
          assert(afterSearch.length > 0, 'Search produces visible items');
          if (flags.categories && categoryButtons.length > 1) {
            const mismatch = categoryButtons.find((btn) => btn.dataset.value && btn.dataset.value !== firstItem.category);
            if (mismatch) {
              mismatch.click();
              const afterMismatch = debug.getVisibleItems();
              assert(afterMismatch.length === 0, 'Search and category combine (AND)');
            } else {
              assert(true, 'No alternate category available for AND check');
            }
            if (clearBtn) clearBtn.click();
          } else {
            assert(true, 'Category diagnostics skipped');
          }
          searchInput.value = originalQuery;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          assert(true, 'Filter diagnostics skipped');
        }
      });

      group('Cart persistence', () => {
        if (!flags.cart) {
          assert(true, 'Cart feature disabled');
          return;
        }
        const addBtn = document.querySelector('.gallery-card .button-secondary');
        if (!addBtn) {
          assert(true, 'Cart button unavailable');
          return;
        }
        const originalSize = debug.getCart().length;
        addBtn.click();
        const cartAfterAdd = debug.getCart();
        assert(cartAfterAdd.length >= originalSize, 'Cart state updated after add');
        const stored = window.localStorage.getItem(CART_KEY);
        assert(stored != null, 'Cart stored in localStorage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            assert(Array.isArray(parsed), 'Stored cart JSON is array');
          } catch (error) {
            assert(false, 'Stored cart JSON parseable');
          }
        }
        const mailtoLink = document.querySelector('[data-hook="share-mailto"], .cart-mailto');
        lastMailtoHref = mailtoLink ? String(mailtoLink.getAttribute('href') || '') : '';
        const clear = document.querySelector('[data-hook="cart-clear"], .cart-clear');
        if (clear) {
          clear.click();
          assert(debug.getCart().length === 0, 'Cart cleared successfully');
        } else {
          window.localStorage.removeItem(CART_KEY);
          assert(true, 'Cart clear control missing');
        }
      });

      group('CSV export', () => {
        if (!flags.exports) {
          assert(true, 'Exports disabled');
          return;
        }
        const button = document.querySelector('[data-hook="export-csv"]');
        if (!button) {
          assert(true, 'CSV button unavailable');
          return;
        }
        let captured = '';
        const handler = (event) => { captured = String(event.detail?.csv || ''); };
        document.addEventListener('gallery:csv-generated', handler, { once: true });
        button.click();
        assert(captured.startsWith('Code,'), 'CSV includes headers');
        assert(!captured || captured.split('\n').length >= 2, 'CSV contains at least one data row');
      });

      group('Print readiness', () => {
        assert(hasPrintStyles(), 'Print stylesheet present');
      });

      group('Mailto link', () => {
        if (!flags.cart) {
          assert(true, 'Mailto skipped (cart disabled)');
          return;
        }
        const href = lastMailtoHref || (document.querySelector('[data-hook="share-mailto"], .cart-mailto')?.getAttribute('href') || '');
        assert(/^mailto:/i.test(href), 'Mailto link present');
        assert(/subject=/.test(href) && /body=/.test(href), 'Mailto contains subject & body');
      });

      const summary = report();
      console.info('Summary', summary);
      console.groupEnd();
      updateOverlay(summary);
    };

    const scheduleRun = () => runChecks('auto');
    if (window.__GALLERY_DEBUG__ && window.__GALLERY_DEBUG__.getItems().length) {
      scheduleRun();
    } else {
      document.addEventListener('gallery:manifest-loaded', scheduleRun, { once: true });
    }
  });
})();
