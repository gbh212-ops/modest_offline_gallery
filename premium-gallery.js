(function () {
  const params = new URLSearchParams(window.location.search || '');
  const DEBUG = params.has('debug');
  const root = window;
  const doc = document;
  const flags = Object.assign({
    FEATURE_CART: true,
    FEATURE_EXPORTS: true,
    FEATURE_SEARCH: true,
    FEATURE_CATEGORIES: true,
  }, root.__GALLERY_FEATURES__ || {});
  const supports = {
    cart: !!flags.FEATURE_CART,
    exports: !!flags.FEATURE_EXPORTS,
    search: !!flags.FEATURE_SEARCH,
    categories: !!flags.FEATURE_CATEGORIES,
  };
  const q = (selector) => doc.querySelector(selector);
  const el = {
    status: q('#status'),
    gallery: q('#gallery'),
    summary: q('.gallery-summary'),
    count: q('#count'),
    year: q('#year'),
    toolbar: q('[data-hook="toolbar"], .toolbar'),
    search: q('[data-hook="search-input"], #search'),
    searchContainer:
      q('[data-hook="search-input"], #search')?.closest('.toolbar-search') || q('.toolbar-search'),
    categorySection:
      q('[data-hook="category-list"], .chip-list')?.closest('[data-hook="category-section"], .toolbar-categories') ||
      q('.toolbar-categories'),
    categoryList: q('[data-hook="category-list"], .chip-list'),
    categoryClear: q('[data-hook="clear-categories"], .chip-clear'),
    csvButton: q('[data-hook="export-csv"], .export-csv'),
    pdfButton: q('[data-hook="export-pdf"], .export-pdf'),
    mailtoButton: q('[data-hook="share-mailto"], .cart-mailto'),
    cartButton: q('[data-hook="cart-button"], .cart-button'),
    cartCount: q('[data-hook="cart-count"], .cart-button__badge'),
    cartDrawer: q('[data-hook="cart-drawer"], .cart-drawer'),
    cartList: q('[data-hook="cart-list"], .cart-list'),
    cartTotal: q('[data-hook="cart-total"], .cart-total'),
    cartClear: q('[data-hook="cart-clear"], .cart-clear'),
  };
  if (el.year) el.year.textContent = String(new Date().getFullYear());
  const state = { items: [], visible: [], categories: [], query: '', selected: new Set(), cart: new Map() };
  const events = {
    manifest: 'gallery:manifest-loaded',
    visible: 'gallery:visible-updated',
    cart: 'gallery:cart-updated',
    csv: 'gallery:csv-generated',
  };
  const CART_KEY = 'cart:v1';
  let cartOpen = false;
  let searchTimer = 0;

  const log = (msg, data) => { if (DEBUG) console.debug('[gallery]', msg, data); };
  const dispatch = (name, detail) => { if (!name) return; try { doc.dispatchEvent(new CustomEvent(name, { detail })); } catch (error) { if (DEBUG) console.warn('dispatch failed', name, error); } };
  const showStatus = (message, type = 'info') => { if (!el.status) return; el.status.textContent = message; el.status.className = `status active${type === 'error' ? ' error' : ''}`; el.status.removeAttribute('hidden'); };
  const hideStatus = () => { if (!el.status) return; el.status.textContent = ''; el.status.className = 'status'; el.status.setAttribute('hidden', 'hidden'); };
  const hideElement = (element) => { if (!element) return; element.setAttribute('hidden', ''); element.setAttribute('aria-hidden', 'true'); element.classList.add('is-hidden'); };
  const salvageJson = (text) => { try { return JSON.parse(text); } catch (error) { const start = text.indexOf('['); const end = text.lastIndexOf(']'); if (start !== -1 && end !== -1 && end > start) return JSON.parse(text.slice(start, end + 1)); throw error; } };
  async function loadManifest(url) { const res = await fetch(url, { cache: 'no-store' }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return salvageJson(await res.text()); }
  const deriveCategory = (raw) => String(raw.category || raw.categories?.[0] || raw.silhouette || 'Uncategorized').trim() || 'Uncategorized';
  const normalizeItem = (raw) => ({ code: String(raw.code || '').trim(), title: String(raw.title || raw.code || 'Untitled style').trim(), src: String(raw.src || raw.image || raw.url || '').trim(), price: raw.price != null && !Number.isNaN(Number(raw.price)) ? Number(raw.price) : null, category: deriveCategory(raw) });
  const collectCategories = (items) => Array.from(new Set(items.map((item) => item.category || 'Uncategorized'))).sort((a, b) => a.localeCompare(b));
  const serializeCart = () => Array.from(state.cart.values()).map(({ item, qty }) => ({ code: item.code, title: item.title, qty, category: item.category, price: item.price }));
  const ensureCartScaffolding = () => { if (!supports.cart) return; if (el.cartDrawer) { if (!el.cartDrawer.id) el.cartDrawer.id = 'cart-drawer'; el.cartDrawer.setAttribute('aria-hidden', 'true'); if (!el.cartDrawer.hasAttribute('tabindex')) el.cartDrawer.setAttribute('tabindex', '-1'); } let backdrop = q('[data-hook="cart-backdrop"], .cart-backdrop'); if (!backdrop) { backdrop = doc.createElement('div'); backdrop.className = 'cart-backdrop'; backdrop.setAttribute('data-hook', 'cart-backdrop'); doc.body.appendChild(backdrop); } el.cartBackdrop = backdrop; };
  const applyFeatureVisibility = () => { if (!supports.search) { if (el.search) el.search.disabled = true; if (el.searchContainer) hideElement(el.searchContainer); } if (!supports.categories) { if (el.categorySection) hideElement(el.categorySection); if (el.categoryClear) el.categoryClear.disabled = true; } if (!supports.exports) { hideElement(el.csvButton); hideElement(el.pdfButton); } if (!supports.cart) { hideElement(el.mailtoButton); hideElement(el.cartButton); hideElement(el.cartDrawer); if (el.cartCount) el.cartCount.textContent = '0'; } };
  const renderGallery = () => { if (!el.gallery) return; el.gallery.innerHTML = ''; const frag = doc.createDocumentFragment(); state.visible.forEach((item) => { const figure = doc.createElement('figure'); figure.className = 'gallery-card'; figure.dataset.code = item.code; figure.innerHTML = `<img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer" /><figcaption class="gallery-card__caption"><div class="gallery-card__code">${item.code || '—'}</div><div class="gallery-card__title">${item.title}</div><div class="gallery-card__meta">${item.category}</div>${supports.cart ? '<div class="gallery-card__actions"><button type="button" class="button-secondary" data-act="add">Add to cart</button></div>' : ''}</figcaption>`; const img = figure.querySelector('img'); img.addEventListener('error', () => console.warn('Failed to load image:', item.src)); if (supports.cart) figure.querySelector('[data-act="add"]').addEventListener('click', () => addToCart(item)); frag.appendChild(figure); }); el.gallery.appendChild(frag); };
  const renderCategoryChips = () => { if (!supports.categories || !el.categoryList) return; el.categoryList.innerHTML = ''; const frag = doc.createDocumentFragment(); state.categories.forEach((name) => { const btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'chip'; btn.dataset.value = name; btn.textContent = name; const active = state.selected.has(name); if (active) btn.classList.add('is-active'); btn.setAttribute('aria-pressed', active ? 'true' : 'false'); btn.addEventListener('click', () => { if (state.selected.has(name)) state.selected.delete(name); else state.selected.add(name); renderCategoryChips(); applyFilters(); }); frag.appendChild(btn); }); el.categoryList.appendChild(frag); updateCategoryControls(); };
  const updateCategoryControls = () => { if (!el.categoryClear) return; const disabled = !supports.categories || state.selected.size === 0; el.categoryClear.disabled = disabled; };
  const clearCategories = () => { state.selected.clear(); renderCategoryChips(); applyFilters(); };
  const updateSummary = () => { if (!el.summary || !el.count) return; if (state.visible.length) { el.summary.classList.add('active'); el.summary.removeAttribute('hidden'); } else { el.summary.classList.remove('active'); el.summary.setAttribute('hidden', 'hidden'); } el.count.textContent = `${state.visible.length} ${state.visible.length === 1 ? 'style' : 'styles'}`; };
  const updateExportAvailability = () => { const disabled = state.visible.length === 0 || !supports.exports; if (el.csvButton) el.csvButton.disabled = disabled; if (el.pdfButton) el.pdfButton.disabled = disabled; };
  const updateCartBadge = () => { if (!supports.cart || !el.cartCount) return; const total = Array.from(state.cart.values()).reduce((sum, { qty }) => sum + qty, 0); el.cartCount.textContent = String(total); if (el.cartButton) el.cartButton.dataset.count = String(total); };
  const renderCart = () => { updateCartBadge(); if (!supports.cart || !el.cartList) return; el.cartList.innerHTML = ''; if (state.cart.size === 0) { const empty = doc.createElement('li'); empty.className = 'cart-empty'; empty.textContent = 'Your cart is empty.'; el.cartList.appendChild(empty); } else { const frag = doc.createDocumentFragment(); state.cart.forEach(({ item, qty }) => { const row = doc.createElement('li'); row.className = 'cart-item'; row.dataset.code = item.code; row.innerHTML = `<div class="cart-item__info"><div class="cart-item__title">${item.title}</div><div class="cart-item__code">${item.code}</div></div><div class="cart-item__controls"><button type="button" data-act="dec" aria-label="Decrease quantity">−</button><span class="cart-item__qty">${qty}</span><button type="button" data-act="inc" aria-label="Increase quantity">+</button><button type="button" data-act="remove" aria-label="Remove item">×</button></div>`; frag.appendChild(row); }); el.cartList.appendChild(frag); } let subtotal = 0; state.cart.forEach(({ item, qty }) => { if (typeof item.price === 'number') subtotal += item.price * qty; }); if (el.cartTotal) el.cartTotal.textContent = subtotal > 0 ? `$${subtotal.toFixed(2)}` : '—'; };
  const persistCart = () => { if (!supports.cart) return; try { const payload = serializeCart().map(({ code, qty }) => ({ code, qty })); root.localStorage.setItem(CART_KEY, JSON.stringify(payload)); } catch (error) { if (DEBUG) console.warn('cart save', error); } };
  const updateMailto = () => { if (!el.mailtoButton) return; const link = buildMailto(); if (link) { el.mailtoButton.href = link; el.mailtoButton.classList.remove('is-disabled'); el.mailtoButton.setAttribute('aria-disabled', 'false'); } else { el.mailtoButton.href = '#'; el.mailtoButton.classList.add('is-disabled'); el.mailtoButton.setAttribute('aria-disabled', 'true'); } };
  const afterCartChange = () => { renderCart(); persistCart(); updateMailto(); dispatch(events.cart, { cart: serializeCart() }); log('cart updated', { size: state.cart.size }); };
  const addToCart = (item) => { if (!supports.cart || !item?.code) return; const entry = state.cart.get(item.code) || { item, qty: 0 }; entry.item = item; entry.qty += 1; state.cart.set(item.code, entry); afterCartChange(); };
  const incrementCart = (code) => { const entry = state.cart.get(code); if (!entry) return; entry.qty += 1; state.cart.set(code, entry); afterCartChange(); };
  const decrementCart = (code) => { const entry = state.cart.get(code); if (!entry) return; entry.qty -= 1; if (entry.qty <= 0) state.cart.delete(code); else state.cart.set(code, entry); afterCartChange(); };
  const removeFromCart = (code) => { if (!state.cart.has(code)) return; state.cart.delete(code); afterCartChange(); };
  const resetCart = () => { state.cart.clear(); afterCartChange(); };
  const loadCart = () => { if (!supports.cart) return; try { const raw = root.localStorage.getItem(CART_KEY); if (!raw) return; const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) return; parsed.forEach(({ code, qty }) => { if (!code || qty <= 0) return; const item = state.items.find((it) => it.code === code); if (item) state.cart.set(code, { item, qty: Number(qty) || 0 }); }); } catch (error) { if (DEBUG) console.warn('cart load', error); } };
  const csvEscape = (value) => { const str = String(value ?? ''); return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str; };
  const buildCsvString = (items) => { const header = ['Code', 'Title', 'Category', 'Price']; const rows = items.map((item) => [item.code, item.title, item.category, item.price != null ? item.price : ''].map(csvEscape).join(',')); return [header.join(','), ...rows].join('\n'); };
  const handleCsvExport = () => { if (!supports.exports || state.visible.length === 0) return; const csv = buildCsvString(state.visible); const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = doc.createElement('a'); link.href = url; link.download = 'gallery.csv'; doc.body.appendChild(link); link.click(); doc.body.removeChild(link); URL.revokeObjectURL(url); dispatch(events.csv, { csv }); };
  const handlePdfExport = () => { if (!supports.exports || state.visible.length === 0) return; doc.body.classList.add('print-mode'); setTimeout(() => { window.print(); doc.body.classList.remove('print-mode'); }, 60); };
  const buildMailto = () => { if (!supports.cart || state.cart.size === 0) return ''; const subject = encodeURIComponent('Modest Bridal Cart'); const body = encodeURIComponent(serializeCart().map(({ qty, code, title }) => `${qty} × ${code} — ${title}`).join('\n')); return `mailto:?subject=${subject}&body=${body}`; };
  const applyFilters = () => { const query = supports.search ? state.query.trim().toLowerCase() : ''; const cats = supports.categories ? state.selected : null; state.visible = state.items.filter((item) => { const matchQuery = !query || `${item.code} ${item.title} ${item.category}`.toLowerCase().includes(query); const matchCats = !cats || cats.size === 0 || cats.has(item.category); return matchQuery && matchCats; }); renderGallery(); updateSummary(); updateExportAvailability(); updateMailto(); dispatch(events.visible, { items: state.visible.slice() }); log('visible updated', { count: state.visible.length }); };
  const handleSearchInput = (event) => { if (!supports.search) return; const value = event?.target?.value ?? ''; if (searchTimer) clearTimeout(searchTimer); searchTimer = root.setTimeout(() => { state.query = value; applyFilters(); }, 200); };
  const handleCartListClick = (event) => { const target = event.target.closest('button[data-act]'); if (!target) return; const code = target.closest('li[data-code]')?.dataset.code; if (!code) return; const act = target.dataset.act; if (act === 'inc') incrementCart(code); else if (act === 'dec') decrementCart(code); else if (act === 'remove') removeFromCart(code); };
  const toggleCart = (open) => { if (!supports.cart || !el.cartDrawer) return; const next = typeof open === 'boolean' ? open : !cartOpen; cartOpen = next; el.cartDrawer.classList.toggle('is-open', cartOpen); el.cartDrawer.setAttribute('aria-hidden', cartOpen ? 'false' : 'true'); if (el.cartButton) el.cartButton.setAttribute('aria-expanded', cartOpen ? 'true' : 'false'); if (el.cartBackdrop) el.cartBackdrop.classList.toggle('is-open', cartOpen); };
  const bindUi = () => { if (supports.search && el.search) el.search.addEventListener('input', handleSearchInput); if (supports.categories && el.categoryClear) el.categoryClear.addEventListener('click', clearCategories); if (supports.exports && el.csvButton) el.csvButton.addEventListener('click', handleCsvExport); if (supports.exports && el.pdfButton) el.pdfButton.addEventListener('click', handlePdfExport); if (el.mailtoButton) el.mailtoButton.addEventListener('click', (event) => { if (!buildMailto()) event.preventDefault(); }); if (supports.cart && el.cartClear) el.cartClear.addEventListener('click', (event) => { event.preventDefault(); resetCart(); }); if (supports.cart && el.cartButton) { el.cartButton.setAttribute('aria-expanded', 'false'); el.cartButton.setAttribute('aria-controls', el.cartDrawer?.id || 'cart-drawer'); el.cartButton.addEventListener('click', () => toggleCart()); } if (supports.cart && el.cartBackdrop) el.cartBackdrop.addEventListener('click', () => toggleCart(false)); if (supports.cart && el.cartList && !el.cartList.dataset.bound) { el.cartList.dataset.bound = 'true'; el.cartList.addEventListener('click', handleCartListClick); } if (supports.cart) doc.addEventListener('keydown', (event) => { if (event.key === 'Escape') toggleCart(false); }); };
  const setupDebug = () => { if (!DEBUG) return; root.__GALLERY_DEBUG__ = Object.freeze({ getFlags: () => Object.assign({}, supports), getItems: () => state.items.slice(), getVisibleItems: () => state.visible.slice(), getCategories: () => state.categories.slice(), getCart: () => serializeCart(), isCartOpen: () => cartOpen }); log('debug ready', root.__GALLERY_DEBUG__); };
  const loadDiagnostics = async () => { if (!DEBUG) return; const scripts = []; if (!root.__GALLERY_ASSERT__) scripts.push('lib/assert.js'); if (!root.__GALLERY_DIAGNOSTICS__) scripts.push('diagnostics.js'); for (const src of scripts) { await new Promise((resolve, reject) => { const tag = doc.createElement('script'); tag.src = src; tag.onload = resolve; tag.onerror = () => reject(new Error(`Failed to load ${src}`)); doc.head.appendChild(tag); }); } };
  const syncCartWithManifest = () => { if (!supports.cart) return; state.cart.clear(); loadCart(); renderCart(); updateMailto(); dispatch(events.cart, { cart: serializeCart() }); };
  async function init() {
    if (!el.gallery) { log('gallery element missing'); return; }
    ensureCartScaffolding();
    applyFeatureVisibility();
    showStatus('Loading gallery…');
    try {
      const manifest = await loadManifest('manifest.json');
      if (!Array.isArray(manifest) || manifest.length === 0) {
        showStatus('The manifest does not contain any gallery items.', 'error');
        return;
      }
      state.items = manifest.map(normalizeItem);
      state.visible = state.items.slice();
      state.categories = collectCategories(state.items);
      if (!supports.categories) state.selected.clear();
      renderCategoryChips();
      bindUi();
      applyFilters();
      hideStatus();
      syncCartWithManifest();
      dispatch(events.manifest, { items: state.items.slice() });
      setupDebug();
      loadDiagnostics().catch((error) => console.error(error));
      log('manifest ready', { count: state.items.length });
    } catch (error) {
      console.error('Failed to load manifest:', error);
      showStatus(`Unable to load manifest.json. ${error.message || error}`, 'error');
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
