import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFilters } from '../../src/hooks/useFilters';
import type { GalleryItem } from '../../src/lib/schema';

const items: GalleryItem[] = [
  { id: 'MB-001', title: 'Silk Gown', src: 'images/a.jpg', tags: ['silk'], category: 'Series 00s' },
  { id: 'MB-002', title: 'Lace Dress', src: 'images/b.jpg', tags: ['lace'], category: 'Series 10s' },
];

describe('useFilters', () => {
  it('filters by search query', () => {
    const { result } = renderHook(() => useFilters(items));

    act(() => {
      result.current.setQuery('lace');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.id).toBe('MB-002');
  });

  it('filters by categories', () => {
    const { result } = renderHook(() => useFilters(items));

    act(() => {
      result.current.setSelectedCategories(['Series 00s']);
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.id).toBe('MB-001');
  });
});
