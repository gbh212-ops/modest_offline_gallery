// Modest Premium Gallery — Ready-to-go JSX (no imports/exports, pure React 18 + Babel)

function ModestPremiumGallery() {
  const { useEffect, useMemo, useRef, useState } = React;

  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [q, setQ] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("All");
  const [groupByCollection, setGroupByCollection] = useState(false);
  const [dense, setDense] = useState(false);
  const [showCodes, setShowCodes] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const shortlistRef = useRef([]);

  // Load manifest.json (expects array of {code, title, src, collection?})
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("manifest.json", { cache: "no-store" });
        const raw = await res.json();
        const normalized = (Array.isArray(raw) ? raw : []).map((x) => ({
          code: String(x.code ?? "").trim(),
          title: String(x.title ?? x.code ?? "").trim(),
          src: String(x.src ?? "").trim(),
          collection: x.collection ? String(x.collection).trim() : undefined,
        }));
        setItems(normalized);
      } catch {
        // Fallback placeholders (only show if manifest missing)
        setItems([
          { code: "MB-001", title: "Style MB-001", src: "images/example1.jpg", collection: "Sample" },
          { code: "MB-002", title: "Style MB-002", src: "images/example2.jpg", collection: "Sample" },
        ]);
      }
    })();
  }, []);

  // Collections for filter chips
  const collections = useMemo(() => {
    const m = {};
    for (const it of items) {
      const key = (it.collection || "Ungrouped").trim();
      m[key] = (m[key] || 0) + 1;
    }
    const list = Object.entries(m).map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [{ name: "All", count: items.length }, ...list];
  }, [items]);

  // Filtered items
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return items.filter((it) => {
      const inText = !needle || `${it.code} ${it.title} ${it.collection || ""}`.toLowerCase().includes(needle);
      const inColl = selectedCollection === "All" || (it.collection || "Ungrouped") === selectedCollection;
      return inText && inColl;
    });
  }, [items, q, selectedCollection]);

  // Grouped data
  const grouped = useMemo(() => {
    if (!groupByCollection) return [];
    const map = new Map();
    for (const it of filtered) {
      const key = (it.collection || "Ungrouped").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, groupByCollection]);

  // Lightbox
  const closeLightbox = () => setActive(null);
  const prev = () => setActive((i) => (i == null ? null : (i + filtered.length - 1) % filtered.length));
  const next = () => setActive((i) => (i == null ? null : (i + 1) % filtered.length));

  useEffect(() => {
    const onKey = (e) => {
      if (active == null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered.length]);

  // Shortlist
  const addToShortlist = (code) => {
    if (!shortlistRef.current.includes(code)) shortlistRef.current.push(code);
  };
  const copyShortlist = async () => {
    const text = shortlistRef.current.join(", ");
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  // Edit helpers
  const updateItem = (code, patch) => {
    setItems((old) => old.map((it) => (it.code === code ? { ...it, ...patch } : it)));
  };
  const exportManifest = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "manifest.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const importManifest = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "[]"));
        const normalized = (Array.isArray(data) ? data : []).map((x) => ({
          code: String(x.code ?? "").trim(),
          title: String(x.title ?? x.code ?? "").trim(),
          src: String(x.src ?? "").trim(),
          collection: x.collection ? String(x.collection).trim() : undefined,
        }));
        setItems(normalized);
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-tight">Private Lookbook</div>
            <span className="text-xs text-neutral-500">Miami Pilot</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, code, collection"
              className="h-9 w-64 max-w-[60vw] rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            />
            <button
              onClick={copyShortlist}
              className="h-9 rounded-xl border px-3 text-sm hover:bg-neutral-50 active:scale-[.99]"
              title="Copy shortlist codes"
            >Shortlist</button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-600">
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={groupByCollection} onChange={(e) => setGroupByCollection(e.target.checked)} /> Group</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} /> Compact</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={showCodes} onChange={(e) => setShowCodes(e.target.checked)} /> Codes</label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditMode((v) => !v)} className={`h-9 rounded-xl border px-3 text-sm ${editMode ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"}`}>{editMode ? "Editing" : "Edit"}</button>
              <button onClick={exportManifest} className="h-9 rounded-xl border px-3 text-sm hover:bg-neutral-50">Export</button>
              <label className="h-9 rounded-xl border px-3 text-sm hover:bg-neutral-50 cursor-pointer flex items-center">
                Import<input type="file" accept="application/json" className="hidden" onChange={(e) => importManifest(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
          {collections.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCollection(c.name)}
              className={`px-3 h-8 rounded-full border text-sm hover:bg-neutral-50 ${selectedCollection === c.name ? "bg-neutral-900 text-white hover:bg-neutral-900" : ""}`}
            >{c.name} <span className="opacity-60">({c.count})</span></button>
          ))}
        </div>
      </header>

      {/* Grid (ungrouped) */}
      {!groupByCollection && (
        <main className="max-w-7xl mx-auto px-4 py-4">
          <div className={`grid ${dense ? "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} grid-cols-2 gap-4`}>
            {filtered.map((it, idx) => (
              <figure key={`${it.code}-${idx}`} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition will-change-transform">
                <button onClick={() => setActive(idx)} className="block w-full" title="View fullscreen">
                  <img src={it.src} alt={it.title} loading="lazy" referrerPolicy="no-referrer" className={`w-full ${dense ? "h-48" : "h-64"} object-cover transition duration-300 group-hover:scale-[1.02]`} />
                </button>
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3">
                  {showCodes && <div className="text-white/90 text-[11px] font-medium tracking-wide">{it.code}</div>}
                  {!editMode && <div className="text-white text-sm font-semibold leading-tight truncate">{it.title}</div>}
                  {!editMode && it.collection && <div className="text-white/80 text-[11px]">{it.collection}</div>}
                  {editMode && (
                    <div className="space-y-2">
                      <input defaultValue={it.title} onBlur={(e) => updateItem(it.code, { title: e.target.value })} className="w-full h-8 rounded-md border px-2 text-xs bg-white/90" />
                      <input defaultValue={it.collection || ""} placeholder="Collection (optional)" onBlur={(e) => updateItem(it.code, { collection: e.target.value || undefined })} className="w-full h-8 rounded-md border px-2 text-xs bg-white/90" />
                    </div>
                  )}
                </figcaption>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => addToShortlist(it.code)} className="px-2 py-1 rounded-full text-xs bg-white/90 hover:bg-white border" title="Add to shortlist">+ Shortlist</button>
                </div>
              </figure>
            ))}
          </div>
          {filtered.length === 0 && <div className="text-center text-sm text-neutral-500 py-16">No items match your filters.</div>}
        </main>
      )}

      {/* Grouped view */}
      {groupByCollection && (
        <main className="max-w-7xl mx-auto px-4 py-4 space-y-8">
          {grouped.map((g) => (
            <section key={g.name}>
              <h2 className="mb-3 text-base font-semibold tracking-tight">{g.name} <span className="text-neutral-400 font-normal">({g.items.length})</span></h2>
              <div className={`grid ${dense ? "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} grid-cols-2 gap-4`}>
                {g.items.map((it) => {
                  const idx = filtered.findIndex((x) => x.code === it.code && x.src === it.src);
                  return (
                    <figure key={`${g.name}-${it.code}`} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
                      <button onClick={() => setActive(idx)} className="block w-full" title="View fullscreen">
                        <img src={it.src} alt={it.title} loading="lazy" referrerPolicy="no-referrer" className={`w-full ${dense ? "h-48" : "h-64"} object-cover transition duration-300 group-hover:scale-[1.02]`} />
                      </button>
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3">
                        {showCodes && <div className="text-white/90 text-[11px] font-medium tracking-wide">{it.code}</div>}
                        {!editMode && <div className="text-white text-sm font-semibold leading-tight truncate">{it.title}</div>}
                        {!editMode && it.collection && <div className="text-white/80 text-[11px]">{it.collection}</div>}
                        {editMode && (
                          <div className="space-y-2">
                            <input defaultValue={it.title} onBlur={(e) => updateItem(it.code, { title: e.target.value })} className="w-full h-8 rounded-md border px-2 text-xs bg-white/90" />
                            <input defaultValue={it.collection || ""} placeholder="Collection (optional)" onBlur={(e) => updateItem(it.code, { collection: e.target.value || undefined })} className="w-full h-8 rounded-md border px-2 text-xs bg-white/90" />
                          </div>
                        )}
                      </figcaption>
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => addToShortlist(it.code)} className="px-2 py-1 rounded-full text-xs bg-white/90 hover:bg-white border">+ Shortlist</button>
                      </div>
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      )}

      {/* Lightbox */}
      {active !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.currentTarget === e.target) closeLightbox(); }}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-xl leading-none">×</button>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-lg">‹</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-lg">›</button>
          <img src={filtered[active].src} alt={filtered[active].title} referrerPolicy="no-referrer" className="max-h-[85vh] max-w-[92vw] rounded-xl shadow-xl" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white">
            {showCodes && <div className="text-xs opacity-80">{filtered[active].code}</div>}
            <div className="text-sm font-medium">{filtered[active].title}</div>
            {filtered[active].collection && <div className="text-xs opacity-80">{filtered[active].collection}</div>}
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Modest Bridal — Private Lookbook</footer>
    </div>
  );
}

