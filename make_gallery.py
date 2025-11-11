

#!/usr/bin/env python3
# Creates manifest.json from files in images/ for the offline gallery.

import os, json

IMAGES_DIR = "images"
OUT = "manifest.json"

def guess_silhouette(name):
    n = name.lower()
    if "ball" in n: return "Ballgown"
    if "mermaid" in n: return "Mermaid"
    if "sheath" in n: return "Sheath"
    if "a-line" in n or "aline" in n or "a line" in n: return "A-Line"
    if "fit" in n: return "Fit-and-Flare"
    return ""

def main():
    if not os.path.isdir(IMAGES_DIR):
        print("Create an 'images' folder and put your images inside it first.")
        return
    files = [f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))]
    files.sort()
    data = []
    for f in files:
        code = os.path.splitext(f)[0]  # Use filename (e.g., MB-001)
        title = "Style " + code
        d = {
            "code": code,
            "title": title,
            "src": f"{IMAGES_DIR}/{f}",
            "silhouette": guess_silhouette(f),
            "tags": ""
        }
        data.append(d)
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)
    print(f"Wrote {OUT} with {len(data)} entries.")

if __name__ == "__main__":

    main()


