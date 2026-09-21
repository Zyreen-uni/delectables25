import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config.js';

/**
 * Edit form for one cart line (UPDATE). Holds its own form state and hands
 * the result to onSave. App.jsx mounts it with key={order.id}, so each open
 * starts fresh from the order.
 */
export default function EditModal({ order, error, isSaving, onSave, onCancel }) {
  const [quantity, setQuantity] = useState(String(order.quantity));
  const [size, setSize] = useState(order.size || 'regular');
  const [notes, setNotes] = useState(order.notes || '');
  const qtyRef = useRef(null);

  useEffect(() => {
    if (qtyRef.current) qtyRef.current.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    onSave(order.id, { quantity, size, notes: notes.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
    >
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Edit order line</p>
        <h3 id="edit-title" className="mt-1 font-display text-xl font-bold text-stone-900">{order.name}</h3>

        <label className="mt-5 block text-sm font-medium text-stone-700" htmlFor="edit-qty">
          Quantity (1 to {CONFIG.MAX_QTY_PER_ITEM})
        </label>
        <input
          id="edit-qty"
          ref={qtyRef}
          type="number"
          min={CONFIG.MIN_QTY_PER_ITEM}
          max={CONFIG.MAX_QTY_PER_ITEM}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />

        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="edit-size">Size</label>
        <select
          id="edit-size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        >
          {CONFIG.SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} (×{s.multiplier})
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="edit-notes">Notes</label>
        <textarea
          id="edit-notes"
          rows={3}
          maxLength={200}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Less sugar, extra cream, candle for a birthday"
          className="mt-1 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
