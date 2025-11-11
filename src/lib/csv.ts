import type { GalleryItem } from './schema';

type CsvRow = Record<string, string | number | undefined>;

const ESCAPE_REGEX = /"/g;

function escape(value: string | number | undefined): string {
  const str = String(value ?? '');
  return `"${str.replace(ESCAPE_REGEX, '""')}"`;
}

export function buildCsvRows(items: GalleryItem[]): CsvRow[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.price,
    category: item.category,
    tags: item.tags.join(' | '),
    src: item.src,
    thumb: item.thumb,
  }));
}

export function exportToCsv(items: GalleryItem[], filename = 'gallery.csv') {
  if (!items.length) return;
  const rows = buildCsvRows(items);
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
