import type { GalleryItem } from '../lib/schema';
import { GalleryCard } from './GalleryCard';

export type GalleryProps = {
  items: GalleryItem[];
  cartLines: Map<string, number>;
  onAdd: (item: GalleryItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
};

export function Gallery({ items, cartLines, onAdd, onIncrement, onDecrement }: GalleryProps) {
  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900">No styles match the filters</h2>
        <p className="text-sm text-neutral-500">Try clearing filters or searching for a different keyword.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          item={item}
          inCartQty={cartLines.get(item.id) ?? 0}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      ))}
    </div>
  );
}
