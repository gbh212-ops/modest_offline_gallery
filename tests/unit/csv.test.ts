import { describe, expect, it } from 'vitest';
import { buildCsvRows } from '../../src/lib/csv';
import type { GalleryItem } from '../../src/lib/schema';

describe('buildCsvRows', () => {
  it('produces rows with expected columns', () => {
    const items: GalleryItem[] = [
      {
        id: 'MB-001',
        title: 'Sample',
        src: 'images/sample.jpg',
        tags: ['A', 'B'],
        category: 'Series 00s',
      },
    ];

    const rows = buildCsvRows(items);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'MB-001',
      title: 'Sample',
      category: 'Series 00s',
      tags: 'A | B',
    });
  });
});
