(function () {
  const params = new URLSearchParams(window.location.search || '');
  const DEBUG = params.has('debug');
  const root = window;
  const doc = document;
  const flags = Object.assign({ FEATURE_CART: true, FEATURE_EXPORTS: true, FEATURE_SEARCH: true, FEATURE_CATEGORIES: true }, root.__GALLERY_FEATURES__ || {});
  const supports = { cart: !!flags.FEATURE_CART, exports: !!flags.FEATURE_EXPORTS, search: !!flags.FEATURE_SEARCH, categories: !!flags.FEATURE_CATEGORIES };
  const q = (selector) => doc.querySelector(selector);
  const el = {
    status: q('#status'),
    gallery: q('#gallery'),
    summary: q('.gallery-summary'),
    count: q('#count'),
    year: q('#year'),
    search: q('[data-hook="search-input"], #search'),
    categoryList: q('[data-hook="category-list"], .chip-list'),
    categoryClear: q('[data-hook="clear-categories"], .chip-clear'),
    csvButton: q('[data-hook="export-csv"]'),
    pdfButton: q('[data-hook="export-pdf"]'),
    mailtoButton: q('[data-hook="share-mailto"]'),
    cartButton: q('[data-hook="cart-button"], .cart-button'),
    cartCount: q('[data-hook="cart-count"], .cart-button__badge'),
    cartList: q('[data-hook="cart-list"]'),
    cartTotal: q('[data-hook="cart-total"]'),
    cartClear: q('[data-hook="cart-clear"], .cart-clear'),
  };
  const state = { items: [], visible: [], categories: [], query: '', selected: new Set(), cart: new Map() };
  const events = { manifest: 'gallery:manifest-loaded', visible: 'gallery:visible-updated', cart: 'gallery:cart-updated', csv: 'gallery:csv-generated' };
  const CART_KEY = 'premium-gallery-cart';
  if (el.year) el.year.textContent = String(new Date().getFullYear());

  const log = (msg, data) => { if (DEBUG) console.debug('[gallery]', msg, data); };
  const dispatch = (name, detail) => { try { doc.dispatchEvent(new CustomEvent(name, { detail })); } catch (error) { if (DEBUG) console.warn('dispatch failed', name, error); } };
  const showStatus = (message, type = 'info') => { if (!el.status) return; el.status.textContent = message; el.status.className = `status active${type === 'error' ? ' error' : ''}`; el.status.removeAttribute('hidden'); };
  const hideStatus = () => { if (!el.status) return; el.status.textContent = ''; el.status.className = 'status'; el.status.setAttribute('hidden', 'hidden'); };
  const salvageJson = (text) => { try { return JSON.parse(text); } catch (error) { const start = text.indexOf('['); const end = text.lastIndexOf(']'); if (start !== -1 && end !== -1 && end > start) return JSON.parse(text.slice(start, end + 1)); throw error; } };
  async function loadManifest(url) { const res = await fetch(url, { cache: 'no-store' }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return salvageJson(await res.text()); }
  const deriveCategory = (raw) => String(raw.category || raw.categories?.[0] || raw.silhouette || 'Uncategorized').trim() || 'Uncategorized';
  const normalizeItem = (raw) => ({ code: String(raw.code || '').trim(), title: String(raw.title || raw.code || 'Untitled style').trim(), src: String(raw.src || raw.image || raw.url || '').trim(), price: raw.price != null ? Number(raw.price) : null, category: deriveCategory(raw) });
  const collectCategories = (items) => Array.from(new Set(items.map((item) => item.category || 'Uncategorized'))).sort((a, b) => a.localeCompare(b));
  function applyFilters() { const query = supports.search ? state.query.trim().toLowerCase() : ''; const cats = supports.categories ? state.selected : null; state.visible = state.items.filter((item) => { const matchQuery = !query || `${item.code} ${item.title} ${item.category}`.toLowerCase().includes(query); const matchCats = !cats || cats.size === 0 || cats.has(item.category); return matchQuery && matchCats; }); renderGallery(); updateSummary(); updateExportAvailability(); updateMailto(); dispatch(events.visible, { items: state.visible.slice() }); log('visible updated', { count: state.visible.length }); }
  function renderGallery() { if (!el.gallery) return; el.gallery.innerHTML = ''; const frag = doc.createDocumentFragment(); state.visible.forEach((item) => frag.appendChild(buildCard(item))); el.gallery.appendChild(frag); }
  function buildCard(item) { const figure = doc.createElement('figure'); figure.className = 'gallery-card'; figure.dataset.code = item.code; const img = doc.createElement('img'); img.src = item.src; img.loading = 'lazy'; img.decoding = 'async'; img.alt = item.title || item.code || 'Gallery image'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => console.warn('Failed to load image:', item.src)); figure.appendChild(img); const caption = doc.createElement('figcaption'); caption.className = 'gallery-card__caption'; caption.innerHTML = `<div class="gallery-card__code">${item.code || '—'}</div><div class="gallery-card__title">${item.title}</div><div class="gallery-card__meta">${item.category}</div>`; if (supports.cart) { const actions = doc.createElement('div'); actions.className = 'gallery-card__actions'; const button = doc.createElement('button'); button.type = 'button'; button.className = 'button-secondary'; button.textContent = 'Add to cart'; button.addEventListener('click', () => addToCart(item)); actions.appendChild(button); caption.appendChild(actions); } figure.appendChild(caption); return figure; }
  const renderCategoryChips = () => { if (!supports.categories || !el.categoryList) return; el.categoryList.innerHTML = ''; state.categories.forEach((name) => { const btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'chip'; btn.dataset.value = name; btn.textContent = name; if (state.selected.has(name)) btn.classList.add('is-active'); btn.addEventListener('click', () => { state.selected.has(name) ? state.selected.delete(name) : state.selected.add(name); renderCategoryChips(); applyFilters(); }); el.categoryList.appendChild(btn); }); };
  const clearCategories = () => { state.selected.clear(); renderCategoryChips(); applyFilters(); };
  const updateSummary = () => { if (!el.summary || !el.count) return; if (state.visible.length) { el.summary.classList.add('active'); el.summary.removeAttribute('hidden'); } else { el.summary.classList.remove('active'); el.summary.setAttribute('hidden', 'hidden'); } el.count.textContent = `${state.visible.length} ${state.visible.length === 1 ? 'style' : 'styles'}`; };
  const updateExportAvailability = () => { const disabled = state.visible.length === 0; if (el.csvButton) el.csvButton.disabled = disabled || !supports.exports; if (el.pdfButton) el.pdfButton.disabled = disabled || !supports.exports; };
  const serializeCart = () => Array.from(state.cart.values()).map(({ item, qty }) => ({ item, qty }));
  function loadCart() { if (!supports.cart) return; try { const raw = root.localStorage.getItem(CART_KEY); if (!raw) return; const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) return; parsed.forEach(({ code, qty }) => { const item = state.items.find((it) => it.code === code); if (item && qty > 0) state.cart.set(code, { item, qty }); }); } catch (error) { if (DEBUG) console.warn('cart load', error); } }
  function persistCart() { if (!supports.cart) return; try { const payload = Array.from(state.cart.values()).map(({ item, qty }) => ({ code: item.code, qty })); root.localStorage.setItem(CART_KEY, JSON.stringify(payload)); } catch (error) { if (DEBUG) console.warn('cart save', error); } }
  const updateCartBadge = () => { if (!supports.cart || !el.cartCount) return; const total = Array.from(state.cart.values()).reduce((sum, { qty }) => sum + qty, 0); el.cartCount.textContent = String(total); if (el.cartButton) el.cartButton.dataset.count = String(total); };
  const renderCart = () => { updateCartBadge(); if (!supports.cart || !el.cartList) return; el.cartList.innerHTML = ''; let subtotal = 0; state.cart.forEach(({ item, qty }) => { const row = doc.createElement('li'); row.className = 'cart-item'; row.innerHTML = `<div class="cart-item__info"><div class="cart-item__title">${item.title}</div><div class="cart-item__code">${item.code}</div></div><div class="cart-item__controls"><button type="button" data-act="dec">−</button><span class="cart-item__qty">${qty}</span><button type="button" data-act="inc">+</button></div>`; row.querySelector('[data-act="inc"]').addEventListener('click', () => incrementCart(item.code)); row.querySelector('[data-act="dec"]').addEventListener('click', () => decrementCart(item.code)); el.cartList.appendChild(row); if (item.price) subtotal += item.price * qty; }); if (el.cartTotal) el.cartTotal.textContent = subtotal ? `$${subtotal.toFixed(2)}` : '—'; };
  function afterCartChange() { renderCart(); persistCart(); updateMailto(); dispatch(events.cart, { cart: serializeCart() }); log('cart updated', { size: state.cart.size }); }
  function addToCart(item) { const qty = (state.cart.get(item.code)?.qty || 0) + 1; state.cart.set(item.code, { item, qty }); afterCartChange(); }
  function incrementCart(code) { const entry = state.cart.get(code); if (!entry) return; entry.qty += 1; afterCartChange(); }
  function decrementCart(code) { const entry = state.cart.get(code); if (!entry) return; entry.qty -= 1; if (entry.qty <= 0) state.cart.delete(code); afterCartChange(); }
  const resetCart = () => { state.cart.clear(); afterCartChange(); };
  const csvEscape = (value) => { const str = String(value ?? ''); return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str; };
  const buildCsvString = (items) => ['Code,Title,Category', ...items.map((item) => [item.code, item.title, item.category].map(csvEscape).join(','))].join('\n');
  const handleCsvExport = () => { if (!supports.exports || state.visible.length === 0) return; const csv = buildCsvString(state.visible); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const link = doc.createElement('a'); link.href = url; link.download = 'gallery.csv'; link.click(); URL.revokeObjectURL(url); dispatch(events.csv, { csv }); };
  const handlePdfExport = () => { if (!supports.exports || state.visible.length === 0) return; doc.body.classList.add('print-mode'); setTimeout(() => { window.print(); doc.body.classList.remove('print-mode'); }, 60); };
  const buildMailto = () => { if (!supports.cart || state.cart.size === 0) return ''; const subject = encodeURIComponent('Modest Bridal Cart'); const body = encodeURIComponent(serializeCart().map(({ item, qty }) => `${qty} × ${item.code} — ${item.title}`).join('\n')); return `mailto:?subject=${subject}&body=${body}`; };
  const updateMailto = () => { if (!el.mailtoButton) return; const link = buildMailto(); el.mailtoButton.href = link || '#'; el.mailtoButton.classList.toggle('is-disabled', !link); };
  function bindUi() { if (el.search) el.search.addEventListener('input', (event) => { state.query = event.target.value || ''; applyFilters(); }); if (el.categoryClear) el.categoryClear.addEventListener('click', clearCategories); if (el.csvButton) el.csvButton.addEventListener('click', handleCsvExport); if (el.pdfButton) el.pdfButton.addEventListener('click', handlePdfExport); if (el.mailtoButton) el.mailtoButton.addEventListener('click', (event) => { if (!buildMailto()) event.preventDefault(); }); if (el.cartClear) el.cartClear.addEventListener('click', resetCart); }
  const setupDebug = () => { if (!DEBUG) return; root.__GALLERY_DEBUG__ = Object.freeze({ getItems: () => state.items.slice(), getVisibleItems: () => state.visible.slice(), getCart: () => serializeCart(), getFlags: () => Object.assign({}, supports) }); log('debug ready', root.__GALLERY_DEBUG__); };
  const loadDiagnostics = async () => {
    if (!DEBUG) return;
    const scripts = [];
    if (!root.__GALLERY_ASSERT__) scripts.push('lib/assert.js');
    if (!root.__GALLERY_DIAGNOSTICS__) scripts.push('diagnostics.js');
    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const tag = doc.createElement('script');
        tag.src = src;
        tag.onload = resolve;
        tag.onerror = () => reject(new Error(`Failed to load ${src}`));
        doc.head.appendChild(tag);
      });
    }
  };
  function syncCartWithManifest() { if (!supports.cart) return; loadCart(); renderCart(); updateMailto(); dispatch(events.cart, { cart: serializeCart() }); }
  async function init() { if (!el.gallery) { log('gallery element missing'); return; } showStatus('Loading gallery…'); try { const manifest = await loadManifest('manifest.json'); if (!Array.isArray(manifest) || manifest.length === 0) { showStatus('The manifest does not contain any gallery items.', 'error'); return; } state.items = manifest.map(normalizeItem); state.visible = state.items.slice(); state.categories = collectCategories(state.items); renderCategoryChips(); bindUi(); applyFilters(); hideStatus(); syncCartWithManifest(); dispatch(events.manifest, { items: state.items.slice() }); setupDebug(); loadDiagnostics().catch((error) => console.error(error)); log('manifest ready', { count: state.items.length }); } catch (error) { console.error('Failed to load manifest:', error); showStatus(`Unable to load manifest.json. ${error.message || error}`, 'error'); } }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
