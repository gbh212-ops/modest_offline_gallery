(function () {
  const statusEl = document.getElementById('status');
  const galleryEl = document.getElementById('gallery');
  const summaryEl = document.querySelector('.gallery-summary');
  const countEl = document.getElementById('count');
  const yearEl = document.getElementById('year');

  const defaultFeatures = {
    FEATURE_CART: true,
    FEATURE_EXPORTS: true,
    FEATURE_SEARCH: true,
    FEATURE_CATEGORIES: true,
  };

  const featureFlags = (function resolveFeatureFlags() {
    if (typeof window === 'undefined') {
      return defaultFeatures;
    }
    const merged = Object.assign({}, defaultFeatures, window.__GALLERY_FEATURES__ || {});
    window.__GALLERY_FEATURES__ = merged;
    return merged;
  })();

  const hasFeature = (key) => Boolean(featureFlags[key]);

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  function showStatus(message, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status active${type === 'error' ? ' error' : ''}`;
    statusEl.removeAttribute('hidden');
  }

  function hideStatus() {
    if (!statusEl) return;
    statusEl.textContent = '';
    statusEl.className = 'status';
    statusEl.setAttribute('hidden', 'hidden');
  }

  function salvageJson(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw error;
    }
  }

  async function loadManifest(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    return salvageJson(text);
  }

  function buildCard(item) {
    const figure = document.createElement('figure');
    figure.className = 'gallery-card';

    const image = document.createElement('img');
    const primarySrc = item.src || item.image || item.url || '';
    image.src = primarySrc;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = item.title || item.code || 'Gallery image';
    image.referrerPolicy = 'no-referrer';

    image.addEventListener('error', () => {
      console.warn('Failed to load image:', primarySrc);
    });

    figure.appendChild(image);

    const caption = document.createElement('figcaption');
    caption.className = 'gallery-card__caption';

    const code = document.createElement('div');
    code.className = 'gallery-card__code';
    code.textContent = item.code || '—';

    const title = document.createElement('div');
    title.className = 'gallery-card__title';
    title.textContent = item.title || 'Untitled style';

    caption.appendChild(code);
    caption.appendChild(title);

    if (item.silhouette || item.tags) {
      const meta = document.createElement('div');
      meta.className = 'gallery-card__meta';
      meta.textContent = [item.silhouette, item.tags]
        .filter(Boolean)
        .join(' • ');
      caption.appendChild(meta);
    }

    figure.appendChild(caption);
    return figure;
  }

  function renderGallery(items) {
    if (!galleryEl) return;
    galleryEl.innerHTML = '';

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(buildCard(item));
    });

    galleryEl.appendChild(fragment);

    if (summaryEl) {
      summaryEl.classList.add('active');
      summaryEl.removeAttribute('hidden');
    }
    if (countEl) {
      const label = items.length === 1 ? 'style' : 'styles';
      countEl.textContent = `${items.length} ${label}`;
    }
  }

  async function init() {
    if (!galleryEl) {
      return;
    }

    showStatus('Loading gallery…');

    try {
      const manifest = await loadManifest('manifest.json');
      if (!Array.isArray(manifest) || manifest.length === 0) {
        showStatus('The manifest does not contain any gallery items.', 'error');
        return;
      }

      renderGallery(manifest);
      hideStatus();
      console.log('Manifest loaded:', {
        count: manifest.length,
        first: manifest[0],
      });
      console.log('FIRST SRC =>', manifest[0] && manifest[0].src);
    } catch (error) {
      console.error('Failed to load manifest:', error);
      showStatus(
        `Unable to load manifest.json. ${error.message || error}`,
        'error'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
