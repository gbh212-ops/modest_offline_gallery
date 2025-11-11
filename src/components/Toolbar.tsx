import { useEffect, useState } from 'react';
import { isFeatureEnabled } from '../config/features';
import type { PdfMode } from '../lib/pdf';

export type ToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: { name: string; count: number }[];
  selectedCategories: string[];
  onToggleCategory: (name: string) => void;
  onClearCategories: () => void;
  onExportCsv: () => void;
  onExportPdf: (mode: PdfMode) => void;
  onShareMailto: () => void;
  onClearCart: () => void;
  filteredCount: number;
  totalCount: number;
  cartCount: number;
  canShare: boolean;
};

const DEBOUNCE_MS = 200;

export function Toolbar({
  query,
  onQueryChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  onExportCsv,
  onExportPdf,
  onShareMailto,
  onClearCart,
  filteredCount,
  totalCount,
  cartCount,
  canShare,
}: ToolbarProps) {
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      onQueryChange(value);
      return () => undefined;
    }
    const handle = window.setTimeout(() => onQueryChange(value), DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value, onQueryChange]);

  const features = {
    csv: isFeatureEnabled('csv'),
    pdf: isFeatureEnabled('pdf'),
    mailto: isFeatureEnabled('mailto'),
    categories: isFeatureEnabled('categories'),
    search: isFeatureEnabled('search'),
    cart: isFeatureEnabled('cart'),
  } as const;

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Private lookbook</p>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Modest Bridal — Premium Gallery
            </h1>
            <p className="text-sm text-neutral-500">
              {filteredCount} of {totalCount} styles visible
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {features.search && (
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Search styles, tags, categories"
                className="h-10 w-64 rounded-full border border-neutral-300 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                aria-label="Search styles"
              />
            )}
            {features.csv && (
              <button
                onClick={onExportCsv}
                className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Export CSV
              </button>
            )}
            {features.pdf && (
              <div className="flex gap-2">
                <button
                  onClick={() => onExportPdf('compact')}
                  className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  PDF (Grid)
                </button>
                <button
                  onClick={() => onExportPdf('single')}
                  className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  PDF (Single)
                </button>
              </div>
            )}
            {features.mailto && (
              <button
                onClick={onShareMailto}
                disabled={!canShare}
                className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Share via Email
              </button>
            )}
            {features.cart && (
              <button
                onClick={onClearCart}
                disabled={cartCount === 0}
                className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Cart ({cartCount})
              </button>
            )}
          </div>
        </div>
        {features.categories && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClearCategories}
              className={`h-8 rounded-full border px-3 text-xs font-medium transition ${
                selectedCategories.length === 0
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => {
              const active = selectedCategories.includes(category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => onToggleCategory(category.name)}
                  className={`h-8 rounded-full border px-3 text-xs font-medium transition ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {category.name} <span className="opacity-60">({category.count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
