# State Scan

```
$ node -v && npm -v
v22.21.0
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
11.4.2

$ git status && git remote -v
On branch feature/restore-gallery-suite
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/

nothing added to commit but untracked files present (use "git add" to track)

$ git log --oneline -n 20
05dbe4e Merge pull request #3 from gbh212-ops/codex/fix-offline-issues-by-bundling-dependencies
1a9104f Make gallery fully offline
16242a8 Merge pull request #1 from gbh212-ops/codex/clone-modest_offline_gallery-and-fix-errors
3316d91 fix: normalize lh3 urls
8ef4ecf chore: ignore macOS metadata
dc4d374 Initial commit
make_gallery.py:4:# Creates manifest.json from files in images/ for the offline gallery.
make_gallery.py:9:OUT = "manifest.json"
index.html:36:  <script src="premium-gallery.js"></script>
premium-gallery.backup.jsx:16:  // Load manifest.json (expects array of {code, title, src, collection?})
premium-gallery.backup.jsx:20:        const res = await fetch("manifest.json", { cache: "no-store" });
premium-gallery.backup.jsx:30:        // Fallback placeholders (only show if manifest missing)
premium-gallery.backup.jsx:78:  const next = () => setActive((i) => (i == null ? null : (i + 1) % filtered.length));
premium-gallery.backup.jsx:85:      if (e.key === "ArrowRight") next();
premium-gallery.backup.jsx:108:    const a = document.createElement("a"); a.href = url; a.download = "manifest.json"; a.click();
premium-gallery.backup.jsx:247:          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-lg">›</button>
manifest.backup.1762753929.json:258:pbpaste > manifest.json
README.txt:11:3) Generate the manifest.json automatically:
README.txt:14:     This scans images/ and writes manifest.json with sensible defaults.
README.txt:16:   (If you don't/can't run Python: manually create a manifest.json listing your images using the format created by the script.)
README.txt:25: - Edit titles/silhouettes by editing manifest.json (keys: code, title, src, silhouette, tags).
premium-gallery.backup.1762746303.jsx:16:  // Load manifest.json (expects array of {code, title, src, collection?})
premium-gallery.backup.1762746303.jsx:20:        const res = await fetch("manifest.json", { cache: "no-store" });
premium-gallery.backup.1762746303.jsx:30:        // Fallback placeholders (only show if manifest missing)
premium-gallery.backup.1762746303.jsx:78:  const next = () => setActive((i) => (i == null ? null : (i + 1) % filtered.length));
premium-gallery.backup.1762746303.jsx:85:      if (e.key === "ArrowRight") next();
premium-gallery.backup.1762746303.jsx:108:    const a = document.createElement("a"); a.href = url; a.download = "manifest.json"; a.click();
premium-gallery.backup.1762746303.jsx:247:          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-lg">›</button>
0:1:    7654 manifest.json
premium-gallery.js:122:      const manifest = await loadManifest('manifest.json');
premium-gallery.js:123:      if (!Array.isArray(manifest) || manifest.length === 0) {
premium-gallery.js:124:        showStatus('The manifest does not contain any gallery items.', 'error');
premium-gallery.js:128:      renderGallery(manifest);
premium-gallery.js:131:        count: manifest.length,
premium-gallery.js:132:        first: manifest[0],
premium-gallery.js:134:      console.log('FIRST SRC =>', manifest[0] && manifest[0].src);
premium-gallery.js:136:      console.error('Failed to load manifest:', error);
premium-gallery.js:138:        `Unable to load manifest.json. ${error.message || error}`,
script.js:67:fetch('manifest.json').then(r => r.json()).then(list => {
premium-gallery.backup.1762789091.jsx:2:/* premium-gallery.jsx
premium-gallery.backup.1762789091.jsx:3:   Minimal, robust gallery that ALWAYS uses manifest.json (no demo placeholders)
premium-gallery.backup.1762789091.jsx:7:function useManifest(url = "manifest.json") {
premium-gallery.backup.1762789091.jsx:17:        if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
premium-gallery.backup.1762789091.jsx:77:        No items in manifest.json
premium-gallery.backup.1762789091.jsx:100:        Reload manifest
premium-gallery.backup.1762789091.jsx:112:function useBustedURL(base = "manifest.json", key = 0) {
premium-gallery.backup.1762789091.jsx:122:  const manifestURL = useBustedURL("manifest.json", reloadKey);
premium-gallery.backup.1762789091.jsx:123:  const { items, error, loading } = useManifest(manifestURL);
premium-gallery.backup.1762789091.jsx:138:          Images come from <code>manifest.json</code> (Google Drive <code>uc?export=view&id=…</code> links).
premium-gallery.backup.1762789091.jsx:147:          Could not load manifest: {String(error.message || error)}

$ rg -n "vite|next|webpack|babel|tailwind|cdn\.tailwindcss\.com|manifest|premium-gallery" --glob '!node_modules'

$ rg -n "cart|csv|pdf|mailto|search|category|categories|service worker|pwa" --glob '!node_modules'
script.js:5:const search = document.getElementById('search');
script.js:54:  const q = (search.value || '').toLowerCase();
script.js:64:search.addEventListener('input', applyFilters);

$ rg -n "image|images|assets|\.webp|\.png|\.jpg|\.jpeg|raw\.githubusercontent|/public/images|/assets/" --glob '!node_modules'
make_gallery.py:4:# Creates manifest.json from files in images/ for the offline gallery.
make_gallery.py:8:IMAGES_DIR = "images"
make_gallery.py:22:        print("Create an 'images' folder and put your images inside it first.")
make_gallery.py:24:    files = [f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))]
index.html:24:        <p>High-resolution imagery stored locally for dependable offline access.</p>
premium-gallery.backup.jsx:32:          { code: "MB-001", title: "Style MB-001", src: "images/example1.jpg", collection: "Sample" },
premium-gallery.backup.jsx:33:          { code: "MB-002", title: "Style MB-002", src: "images/example2.jpg", collection: "Sample" },
README.txt:3:1) Bulk-download images from the source pages (with permission). Fastest tools:
README.txt:7:   Tip: On each collection/product page, run the extension, select large images, and download to the 'images/' folder.
README.txt:9:2) Rename images to neutral SKUs (e.g., MB-001.jpg, MB-002.jpg). Strip EXIF if possible (Mac Preview > Export; or ImageOptim).
README.txt:14:     This scans images/ and writes manifest.json with sensible defaults.
README.txt:16:   (If you don't/can't run Python: manually create a manifest.json listing your images using the format created by the script.)
premium-gallery.backup.1762746303.jsx:32:          { code: "MB-001", title: "Style MB-001", src: "images/example1.jpg", collection: "Sample" },
premium-gallery.backup.1762746303.jsx:33:          { code: "MB-002", title: "Style MB-002", src: "images/example2.jpg", collection: "Sample" },
manifest.json:5:    "src": "images/MB-001.jpg",
manifest.json:12:    "src": "images/MB-004.jpg",
manifest.json:19:    "src": "images/MB-005.jpg",
manifest.json:26:    "src": "images/MB-006.jpg",
manifest.json:33:    "src": "images/MB-007.jpg",
manifest.json:40:    "src": "images/MB-008.jpg",
manifest.json:47:    "src": "images/MB-009.jpg",
manifest.json:54:    "src": "images/MB-010.jpg",
manifest.json:61:    "src": "images/MB-011.jpg",
manifest.json:68:    "src": "images/MB-012.jpg",
manifest.json:75:    "src": "images/MB-013.jpg",
manifest.json:82:    "src": "images/MB-014.jpg",
manifest.json:89:    "src": "images/MB-015.jpg",
manifest.json:96:    "src": "images/MB-016.jpg",
manifest.json:103:    "src": "images/MB-017.jpg",
manifest.json:110:    "src": "images/MB-018.jpg",
manifest.json:117:    "src": "images/MB-019.jpg",
manifest.json:124:    "src": "images/MB-020.jpg",
manifest.json:131:    "src": "images/MB-021.jpg",
manifest.json:138:    "src": "images/MB-022.jpg",
manifest.json:145:    "src": "images/MB-023.jpg",
manifest.json:152:    "src": "images/MB-024.jpg",
manifest.json:159:    "src": "images/MB-025.jpg",
manifest.json:166:    "src": "images/MB-026.jpg",
manifest.json:173:    "src": "images/MB-027.jpg",
manifest.json:180:    "src": "images/MB-028.jpg",
manifest.json:187:    "src": "images/MB-029.jpg",
manifest.json:194:    "src": "images/MB-030.jpg",
manifest.json:201:    "src": "images/MB-031.jpg",
manifest.json:208:    "src": "images/MB-032.jpg",
manifest.json:215:    "src": "images/MB-033.jpg",
manifest.json:222:    "src": "images/MB-034.jpg",
manifest.json:229:    "src": "images/MB-035.jpg",
manifest.json:236:    "src": "images/MB-036.jpg",
manifest.json:243:    "src": "images/MB-037.jpg",
manifest.json:250:    "src": "images/MB-038.jpg",
manifest.json:257:    "src": "images/MB-039.jpg",
manifest.json:264:    "src": "images/MB-040.jpg",
manifest.json:271:    "src": "images/MB-041.jpg",
manifest.json:278:    "src": "images/MB-042.jpg",
manifest.json:285:    "src": "images/MB-043.jpg",
manifest.json:292:    "src": "images/MB-044.jpg",
manifest.json:299:    "src": "images/MB-045.jpg",
manifest.json:306:    "src": "images/MB-046.jpg",
manifest.json:313:    "src": "images/MB-047.jpg",
manifest.json:320:    "src": "images/MB-048.jpg",
manifest.json:327:    "src": "images/MB-049.jpg",
manifest.json:334:    "src": "images/MB-050.jpg",
manifest.json:341:    "src": "images/MB-051.jpg",
manifest.json:348:    "src": "images/MB-052.jpg",
manifest.json:355:    "src": "images/MB-053.jpg",
premium-gallery.js:52:    const image = document.createElement('img');
premium-gallery.js:53:    const primarySrc = item.src || item.image || item.url || '';
premium-gallery.js:54:    image.src = primarySrc;
premium-gallery.js:55:    image.loading = 'lazy';
premium-gallery.js:56:    image.decoding = 'async';
premium-gallery.js:57:    image.alt = item.title || item.code || 'Gallery image';
premium-gallery.js:58:    image.referrerPolicy = 'no-referrer';
premium-gallery.js:60:    image.addEventListener('error', () => {
premium-gallery.js:61:      console.warn('Failed to load image:', primarySrc);
premium-gallery.js:64:    figure.appendChild(image);
script.js:72:    {code:'MB-001', title:'Crepe A-Line', src:'images/example1.jpg', silhouette:'A-Line'},
script.js:73:    {code:'MB-002', title:'Satin Ballgown', src:'images/example2.jpg', silhouette:'Ballgown'}

$ rg -n "TODO|FIXME|HACK|@deprecated" --glob '!node_modules'
```
