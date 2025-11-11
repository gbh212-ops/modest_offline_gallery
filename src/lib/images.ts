const staticImages = import.meta.glob('../../images/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  as: 'url'
}) as Record<string, string>;

const EMBEDDED_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">` +
      `<rect width="32" height="32" rx="8" fill="#E5E7EB"/>` +
      `<path d="M6 22L12.5 13.5L18 19L22 15L26 22H6Z" fill="#9CA3AF"/>` +
    `</svg>`
  );

const imageMap = new Map<string, string>();

function register(key: string, value: string) {
  const normalised = key.replace(/^\.\/?/, '');
  imageMap.set(normalised, value);
  imageMap.set(normalised.toLowerCase(), value);
}

Object.entries(staticImages).forEach(([rawKey, value]) => {
  const cleaned = rawKey.replace(/^\.\.\/+/g, '').replace(/^images\//, '');
  register(cleaned, value);
  register(`images/${cleaned}`, value);
});

const FALLBACK_IMAGE =
  imageMap.get('placeholder.webp') ||
  imageMap.get('images/placeholder.webp') ||
  EMBEDDED_PLACEHOLDER;

export function getPlaceholderImage() {
  return FALLBACK_IMAGE;
}

export function resolveImagePath(src?: string) {
  if (!src) return FALLBACK_IMAGE;
  if (/^(?:https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  const trimmed = src.replace(/^\.\/?/, '');
  const candidates = [
    trimmed,
    trimmed.toLowerCase(),
    `images/${trimmed}`,
    `images/${trimmed.toLowerCase()}`
  ];
  for (const candidate of candidates) {
    const match = imageMap.get(candidate);
    if (match) return match;
  }
  return FALLBACK_IMAGE;
}

export function withImageFallback(src: string, fallback = FALLBACK_IMAGE) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(fallback);
    img.src = src;
  });
}
