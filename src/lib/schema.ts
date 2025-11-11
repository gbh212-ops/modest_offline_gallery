import { resolveImagePath } from './images';

export type RawManifestItem = {
  id?: string;
  code?: string;
  title?: string;
  description?: string;
  price?: number | string;
  category?: string;
  collection?: string;
  silhouette?: string;
  tags?: string[] | string;
  src?: string;
  image?: string;
  url?: string;
  thumb?: string;
  thumbnail?: string;
  meta?: Record<string, string>;
};

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  tags: string[];
  src: string;
  thumb?: string;
  meta?: Record<string, string>;
};

function coerceNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function coerceTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function deriveCategoryFromCode(code?: string): string | undefined {
  if (!code) return undefined;
  const match = code.match(/^[A-Z]+-(\d+)/i);
  if (!match) return undefined;
  const numeric = match[1];
  const bucket = numeric.length > 1 ? `${numeric[0]}0s` : numeric;
  return `Series ${bucket}`;
}

function coerceCategory(item: RawManifestItem): string | undefined {
  const explicit = [item.category, item.collection, item.silhouette]
    .map((c) => (c ? String(c).trim() : ''))
    .find((c) => c.length > 0);
  if (explicit) return explicit;
  return deriveCategoryFromCode(item.code);
}

function coerceSrc(item: RawManifestItem): string {
  const candidates = [item.src, item.image, item.url];
  const src = candidates.map((c) => (c ? String(c).trim() : '')).find((c) => c.length > 0);
  return resolveImagePath(src);
}

export function normalizeManifest(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const data = item as RawManifestItem;
      const id = (data.id || data.code || data.title || data.src || '').toString().trim();
      if (!id) return null;
      const title = (data.title || data.code || 'Untitled style').toString().trim();
      const price = coerceNumber(data.price);
      const category = coerceCategory(data);
      const tags = (() => {
        const list = coerceTags(data.tags);
        if (category && !list.includes(category)) {
          list.push(category);
        }
        return list;
      })();
      const src = coerceSrc(data);
      const thumbRaw = data.thumb || data.thumbnail;
      const thumb = thumbRaw ? resolveImagePath(String(thumbRaw).trim()) : undefined;
      const meta = data.meta && typeof data.meta === 'object' ? data.meta : undefined;
      return { id, title, description: data.description?.toString(), price, category, tags, src, thumb, meta } satisfies GalleryItem;
    })
    .filter((item): item is GalleryItem => Boolean(item));
}
