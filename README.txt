QUICK START (5 minutes)

1) Bulk-download images from the source pages (with permission). Fastest tools:
   - Chrome extension: Imageye (Image downloader)
   - Chrome extension: Fatkun Batch Download Image
   - Firefox: DownThemAll!
   Tip: On each collection/product page, run the extension, select large images, and download to the 'images/' folder.

2) Rename images to neutral SKUs (e.g., MB-001.jpg, MB-002.jpg). Strip EXIF if possible (Mac Preview > Export; or ImageOptim).

3) Generate the manifest.json automatically:
   - If you have Python 3 installed, run:
       python make_gallery.py
     This scans images/ and writes manifest.json with sensible defaults.

   (If you don't/can't run Python: manually create a manifest.json listing your images using the format created by the script.)

4) Open index.html in your browser. That's it. No internet, no hosting.

5) Showing to clients:
   - Laptop/iPad (Files app in iPadOS will open index.html in Safari)
   - Optional: Share a ZIP to a sales rep; they unzip and double-click index.html.

Customization (optional):
 - Edit titles/silhouettes by editing manifest.json (keys: code, title, src, silhouette, tags).
 - Keep manufacturer identity out of filenames and metadata.
 - Consider a subtle watermark using a batch tool before step 3.
