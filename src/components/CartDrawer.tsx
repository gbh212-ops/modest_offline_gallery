import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { isFeatureEnabled } from '../config/features';
import type { CartLine } from '../hooks/useCart';

export type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  subtotal: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
};

const CART_ENABLED = isFeatureEnabled('cart');

export function CartDrawer({ open, onClose, lines, subtotal, onIncrement, onDecrement, onRemove }: CartDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!CART_ENABLED) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Cart</h2>
            <p className="text-sm text-neutral-500">{lines.length} {lines.length === 1 ? 'style' : 'styles'} selected</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100" aria-label="Close cart">
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <p className="text-sm text-neutral-500">Add styles to the cart to build a shortlist.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4">
                  <img
                    src={line.item.thumb || line.item.src}
                    alt={line.item.title}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{line.item.title}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">{line.item.id}</p>
                    </div>
                    {line.item.price != null && (
                      <p className="text-sm text-neutral-500">${(line.item.price * line.qty).toFixed(2)}</p>
                    )}
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        onClick={() => onDecrement(line.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                        aria-label={`Remove one ${line.item.title}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                      <button
                        onClick={() => onIncrement(line.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                        aria-label={`Add one ${line.item.title}`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => onRemove(line.id)}
                        className="ml-auto text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
