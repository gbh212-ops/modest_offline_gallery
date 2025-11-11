import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { useCart } from '../../src/hooks/useCart';
import type { GalleryItem } from '../../src/lib/schema';

const sampleItem: GalleryItem = {
  id: 'MB-001',
  title: 'Sample',
  src: 'images/sample.jpg',
  tags: [],
};

describe('useCart', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds and increments items', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.add(sampleItem);
      result.current.add(sampleItem);
    });

    expect(result.current.lines[0]?.qty).toBe(2);
    expect(result.current.totalItems).toBe(2);
  });

  it('decrements and removes items', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.add(sampleItem);
      result.current.increment(sampleItem.id);
    });

    act(() => {
      result.current.decrement(sampleItem.id);
      result.current.decrement(sampleItem.id);
    });

    expect(result.current.lines.length).toBe(0);
    expect(result.current.totalItems).toBe(0);
  });
});
