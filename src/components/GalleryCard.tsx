import { useState } from 'react';
import { isFeatureEnabled } from '../config/features';
import { getPlaceholderImage } from '../lib/images';
import type { GalleryItem } from '../lib/schema';

export type GalleryCardProps = {
  item: GalleryItem;
  inCartQty: number;
  onAdd: (item: GalleryItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
};

const PLACEHOLDER = getPlaceholderImage();

export function GalleryCard({ item, inCartQty, onAdd, onIncrement, onDecrement }: GalleryCardProps) {
  const [src, setSrc] = useState(item.thumb || item.src);
  const cartEnabled = isFeatureEnabled('cart');

  return (
    <figure className="group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <img
          src={src}
          alt={item.title}
          loading="lazy"
          className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          onError={() => setSrc(PLACEHOLDER)}
        />
        {item.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 shadow"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <figcaption className="flex flex-1 flex-col gap-2 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{item.id}</p>
          <h2 className="text-lg font-semibold text-neutral-900">{item.title}</h2>
          {item.category && <p className="text-sm text-neutral-500">{item.category}</p>}
          {item.description && <p className="mt-1 text-sm text-neutral-500">{item.description}</p>}
        </div>
        {item.price != null && (
          <p className="text-sm font-semibold text-neutral-700">${item.price.toFixed(2)}</p>
        )}
        {cartEnabled && (
          <div className="mt-auto flex items-center justify-between">
            {inCartQty === 0 ? (
              <button
                onClick={() => onAdd(item)}
                className="flex h-10 items-center justify-center rounded-full bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Add to cart
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDecrement(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:bg-neutral-100"
                  aria-label={`Remove one ${item.title}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-neutral-900">{inCartQty}</span>
                <button
                  onClick={() => onIncrement(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:bg-neutral-100"
                  aria-label={`Add one ${item.title}`}
                >
                  +
                </button>
              </div>
            )}
            <span className="text-xs text-neutral-400">Cart</span>
          </div>
        )}
      </figcaption>
    </figure>
  );
}
