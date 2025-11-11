import { useMemo, useState } from 'react';
import rawManifest from './data/manifest.json';
import { CartDrawer } from './components/CartDrawer';
import { Gallery } from './components/Gallery';
import { Toolbar } from './components/Toolbar';
import { isFeatureEnabled } from './config/features';
import { useCart } from './hooks/useCart';
import { useFilters } from './hooks/useFilters';
import { exportToCsv } from './lib/csv';
import { exportItemsToPdf } from './lib/pdf';
import { buildMailtoLink } from './lib/mailto';
import { normalizeManifest } from './lib/schema';

export default function App() {
  const items = useMemo(() => normalizeManifest(rawManifest), []);
  const cart = useCart();
  const filters = useFilters(items);
  const [cartOpen, setCartOpen] = useState(false);

  const filteredItems = filters.filtered;
  const cartMap = useMemo(() => new Map(cart.lines.map((line) => [line.id, line.qty])), [cart.lines]);

  const handleExportCsv = () => {
    exportToCsv(filteredItems);
  };

  const handleExportPdf = async (mode: 'compact' | 'single') => {
    await exportItemsToPdf(filteredItems, mode);
  };

  const handleMailto = () => {
    const link = buildMailtoLink(cart.lines.map((line) => line.item));
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        categories={filters.categories}
        selectedCategories={filters.selectedCategories}
        onToggleCategory={(category) => {
          if (filters.selectedCategories.includes(category)) {
            filters.setSelectedCategories(filters.selectedCategories.filter((name) => name !== category));
          } else {
            filters.setSelectedCategories([...filters.selectedCategories, category]);
          }
        }}
        onClearCategories={() => filters.setSelectedCategories([])}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        onShareMailto={handleMailto}
        onClearCart={cart.clear}
        filteredCount={filteredItems.length}
        totalCount={items.length}
        cartCount={cart.totalItems}
        canShare={cart.lines.length > 0}
      />
      <main>
        <Gallery
          items={filteredItems}
          cartLines={cartMap}
          onAdd={(item) => {
            cart.add(item);
            setCartOpen(true);
          }}
          onIncrement={cart.increment}
          onDecrement={cart.decrement}
        />
      </main>
      {isFeatureEnabled('cart') && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
        >
          Cart
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-900">
            {cart.totalItems}
          </span>
        </button>
      )}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        subtotal={cart.subtotal}
        onIncrement={cart.increment}
        onDecrement={cart.decrement}
        onRemove={cart.remove}
      />
    </div>
  );
}
