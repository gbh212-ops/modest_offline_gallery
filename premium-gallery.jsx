/** premium-gallery.jsx
 * Modest Bridal — Premium Gallery (no build step)
 * Converts any Drive link to lh3.googleusercontent.com on the fly.
 */

/* ---------------- helpers: extract ID + normalize to lh3 ---------------- */

function extractDriveId(u = "") {
  try { u = String(u).trim(); } catch {}
  if (!u) return null;

  // Try all common Google Drive shapes
  const m =
    u.match(/[?&]id=([^&#/]+)/) ||         // ...?id=FILE_ID
    u.match(/\/file\/d\/([^/?#]+)/) ||     // /file/d/FILE_ID/...
    u.match(/\/d\/([^/?#]+)/);             // /d/FILE_ID/...

  return m ? m[1] : null;
}

function toLh3(u, size = "s2000") {
  if (!u) return u;

  const url = String(u).trim();

  if (url.includes("lh3.googleusercontent.com")) {
    const sizePattern = /=(?:s|w|h)\d+(?:-[a-z0-9-]+)*$/i;

    const [withoutHash, hash = ""] = url.split("#");
    const [base, query = ""] = withoutHash.split("?");

    if (sizePattern.test(base)) {
      const updatedBase = base.replace(sizePattern, `=${size}`);
      const querySuffix = query ? `?${query}` : "";
      const hashSuffix = hash ? `#${hash}` : "";
      return `${updatedBase}${querySuffix}${hashSuffix}`;
    }

    if (!query) {
      const hashSuffix = hash ? `#${hash}` : "";
      return `${base}=${size}${hashSuffix}`;
    }

    return url;
  }

  const id = extractDriveId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=${size}` : url;
}

/* ---------------- small utilities ---------------- */

async function loadManifest(url) {
  // cache-bust while developing
  const res = await fetch(`${url}?v=${Date.now()}`);
  const text = await res.text();

  // Normal case
  try { return JSON.parse(text); } catch {}

  // In case the file got stray text around it, salvage just the JSON array
  const a = text.indexOf("[");
  const b = text.lastIndexOf("]");
  if (a !== -1 && b !== -1 && b > a) {
    return JSON.parse(text.slice(a, b + 1));
  }

  throw new Error("manifest.json is not valid JSON");
}

/* ---------------- image with robust fallback sizes ---------------- */

function GalleryImage({ src, alt }) {
  const [url, setUrl] = React.useState(src);
  const tries = React.useRef(0);

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="block w-full h-auto rounded-xl"
      onError={() => {
        tries.current += 1;
        if (tries.current === 1)      setUrl(src.replace(/=s\d+$/, "=s1600"));
        else if (tries.current === 2) setUrl(src.replace(/=s\d+$/, "=w2000"));
        else                          console.warn("Image failed:", src);
      }}
    />
  );
}

/* ---------------- main component ---------------- */

function ModestPremiumGallery() {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await loadManifest("manifest.json");
        const normalized = raw.map((it) => {
          const firstUrl = it.src || it.image || it.url || "";
          return { ...it, src: toLh3(firstUrl) };
        });
        setItems(normalized);
        console.log("Manifest loaded:", { count: normalized.length, first: normalized[0] });
        console.log("FIRST SRC =>", normalized[0]?.src);
      } catch (e) {
        console.error(e);
        setError(String(e.message || e));
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-700">
        <h2 className="text-xl font-semibold mb-2">Manifest error</h2>
        <pre className="bg-red-50 p-3 rounded">{error}</pre>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-500">Loading gallery…</div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Modest Bridal — Private Lookbook</h1>
        <p className="text-sm text-gray-500">Images served via Google Photos CDN (lh3).</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it) => (
          <figure key={it.code || it.title} className="bg-white border rounded-2xl p-3 shadow-sm">
            <GalleryImage src={it.src} alt={it.title || it.code} />
            <figcaption className="mt-3">
              <div className="text-sm font-medium">{it.title || it.code}</div>
              {it.code && <div className="text-xs text-gray-500">{it.code}</div>}
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}

/* expose to window so index.html can mount it */
window.ModestPremiumGallery = ModestPremiumGallery;

