import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import type { GalleryItem } from '../lib/schema';

export type FilterState = {
  query: string;
  categories: string[];
};

const DEFAULT_OPTIONS: Fuse.IFuseOptions<GalleryItem> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.2 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: false,
  ignoreLocation: true,
};

export function useFilters(items: GalleryItem[]) {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const fuse = useMemo(() => new Fuse(items, DEFAULT_OPTIONS), [items]);

  useEffect(() => {
    fuse.setCollection(items);
  }, [items, fuse]);

  const filteredBySearch = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return items;
    return fuse.search(trimmed).map((result) => result.item);
  }, [fuse, items, query]);

  const filtered = useMemo(() => {
    if (!selectedCategories.length) return filteredBySearch;
    const categories = new Set(selectedCategories.map((cat) => cat.toLowerCase()));
    return filteredBySearch.filter((item) =>
      item.category ? categories.has(item.category.toLowerCase()) : false
    );
  }, [filteredBySearch, selectedCategories]);

  const categories = useMemo(() => {
    const counter = new Map<string, number>();
    for (const item of items) {
      if (!item.category) continue;
      const key = item.category;
      counter.set(key, (counter.get(key) || 0) + 1);
    }
    return Array.from(counter.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return {
    query,
    setQuery,
    selectedCategories,
    setSelectedCategories,
    filtered,
    categories,
  };
}
