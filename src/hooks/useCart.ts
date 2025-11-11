import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GalleryItem } from '../lib/schema';

export type CartLine = {
  id: string;
  qty: number;
  item: GalleryItem;
};

const STORAGE_KEY = 'cart:v1';

function revive(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((line) => {
      if (!line || typeof line !== 'object') return null;
      const { id, qty, item } = line as CartLine;
      if (!id || !qty || !item) return null;
      return { id, qty, item } satisfies CartLine;
    })
    .filter((line): line is CartLine => Boolean(line));
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? revive(JSON.parse(raw)) : [];
    } catch (error) {
      console.warn('Failed to parse cart state', error);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((item: GalleryItem) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, qty: line.qty + 1, item } : line
        );
      }
      return [...prev, { id: item.id, qty: 1, item }];
    });
  }, []);

  const increment = useCallback((id: string) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line)));
  }, []);

  const decrement = useCallback((id: string) => {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.id !== id) return [line];
        if (line.qty <= 1) return [];
        return [{ ...line, qty: line.qty - 1 }];
      })
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totalItems = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + (line.item.price || 0) * line.qty, 0),
    [lines]
  );

  return {
    lines,
    add,
    increment,
    decrement,
    remove,
    clear,
    totalItems,
    subtotal,
  };
}
