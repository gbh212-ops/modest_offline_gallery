
/* premium-gallery.jsx
   Minimal, robust gallery that ALWAYS uses manifest.json (no demo placeholders)
*/
const { useEffect, useState, useMemo } = React;

function useManifest(url = "manifest.json") {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
        const data = await res.json();
        if (!alive) return;

        // Validate a bit
        const cleaned = (Array.isArray(data) ? data : [])
          .filter(x => x && typeof x === "object" && x.src)
          .map((x, i) => ({
            code: x.code || `MB-${String(i + 1).padStart(3, "0")}`,
            title: x.title || x.code || `Style ${i + 1}`,
            src: String(x.src).trim(),
            collection: x.collection || "Ungrouped",
            price: typeof x.price === "number" ? x.price : 0
          }));

        setItems(cleaned);
        setError(null);
      } catch (e) {
        console.error("Manifest load error:", e);
        setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [url]);

  return { items, error, loading };
}

function Card({ item }) {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] bg-gray-50">
        {/* Critical: use item.src directly; do not rewrite, do not prefix, no '=s2000' magic */}
        <img
          src={item.src}
          alt={item.title || item.code}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn("Image failed:", item.src);
            e.currentTarget.alt = "Image failed to load";
            e.currentTarget.style.opacity = 0.4;
          }}
        />
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-500">{item.code}</div>
        <div className="font-medium">{item.title}</div>
      </div>
    </div>
  );
}

function Grid({ items }) {
  if (!items.length) {
    return (
      <div className="text-center text-gray-500 py-16">
        No items in manifest.json
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <Card key={it.code} item={it} />
      ))}
    </div>
  );
}

function Toolbar({ total, onReload }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="text-sm text-gray-600">
        {total} style{total === 1 ? "" : "s"}
      </div>
      <button
        onClick={onReload}
        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
      >
        Reload manifest
      </button>
    </div>
  );
}

function useReloadKey() {
  const [k, setK] = useState(0);
  const reload = () => setK((v) => v + 1);
  return [k, reload];
}

function useBustedURL(base = "manifest.json", key = 0) {
  const u = useMemo(() => {
    const ts = Date.now();
    return `${base}?v=${ts}-${key}`;
  }, [base, key]);
  return u;
}

function PremiumGalleryApp() {
  const [reloadKey, reload] = useReloadKey();
  const manifestURL = useBustedURL("manifest.json", reloadKey);
  const { items, error, loading } = useManifest(manifestURL);

  useEffect(() => {
    // Helpful debug so you can see what the app read
    if (!loading) {
      console.log("Manifest loaded:", { count: items.length, first: items[0] });
      if (items[0]) console.log("FIRST SRC =>", items[0].src);
    }
  }, [loading, items]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Private Lookbook — Modest Bridal</h1>
        <p className="text-gray-600 text-sm mt-1">
          Images come from <code>manifest.json</code> (Google Drive <code>uc?export=view&id=…</code> links).
        </p>
      </div>

      <Toolbar total={items.length} onReload={reload} />

      {loading && <div className="text-gray-500">Loading…</div>}
      {error && (
        <div className="text-red-600 mb-3">
          Could not load manifest: {String(error.message || error)}
        </div>
      )}
      {!loading && !error && <Grid items={items} />}
    </div>
  );
}

// Export for index.html
function ModestPremiumGallery() {
  return <PremiumGalleryApp />;
}
