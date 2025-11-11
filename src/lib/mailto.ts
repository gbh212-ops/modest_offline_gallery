import type { GalleryItem } from './schema';

export function buildMailtoLink(items: GalleryItem[], subject = 'Gallery selection') {
  if (!items.length) return '';
  const lines = items.map((item, index) => `${index + 1}. ${item.title} (${item.id}) - ${item.src}`);
  const params = new URLSearchParams({
    subject,
    body: lines.join('\n'),
  });
  return `mailto:?${params.toString()}`;
}
