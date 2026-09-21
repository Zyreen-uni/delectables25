import { useState } from 'react';
import { CONFIG } from '../config.js';
import { formatMoney } from '../utils/pricing.js';

/**
 * One dessert card, built from data.
 * The image, the title and the Add to Cart button all call the same onAdd
 * handler. Clicks on the rest of the card do nothing, so a near miss on the
 * stepper never adds an item by accident.
 */
export default function DessertCard({ meal, isAdding, onAdd, onWarn }) {
  // Kept as a string so the field can be blank while the user types.
  const [qty, setQty] = useState('1');

  function step(delta) {
    const next = (Number(qty) || 0) + delta;
    if (next > CONFIG.MAX_QTY_PER_ITEM) {
      onWarn('Maximum ' + CONFIG.MAX_QTY_PER_ITEM + ' per dessert.');
      setQty(String(CONFIG.MAX_QTY_PER_ITEM));
      return;
    }
    setQty(String(Math.max(0, next)));
  }

  function handleTyped(value) {
    if (value === '') {
      setQty('');
      return;
    }
    const n = Number(value);
    if (n > CONFIG.MAX_QTY_PER_ITEM) {
      onWarn('Maximum ' + CONFIG.MAX_QTY_PER_ITEM + ' per dessert.');
      setQty(String(CONFIG.MAX_QTY_PER_ITEM));
    } else if (n < 0) {
      setQty('0');
    } else {
      setQty(value);
    }
  }

  function add() {
    if (isAdding) return;
    onAdd(meal, Number(qty));
  }

  const tags = meal.tags && meal.tags.length ? meal.tags.slice(0, 2) : [meal.area];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:shadow-lg hover:ring-rose-200">
      <button
        type="button"
        onClick={add}
        aria-label={'Add ' + meal.name + ' to cart'}
        className="relative block h-44 overflow-hidden bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
      >
        <img
          src={meal.thumb}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-stone-800 shadow-sm">
          {formatMoney(meal.price)}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3
          onClick={add}
          className="cursor-pointer font-display text-lg font-semibold leading-snug text-stone-900 transition group-hover:text-rose-700"
        >
          {meal.name}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={tag + i} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-stone-100 pt-4">
          <div className="flex items-center rounded-lg ring-1 ring-stone-300">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={'Decrease quantity of ' + meal.name}
              className="h-9 w-9 rounded-l-lg text-lg font-bold text-stone-500 transition hover:bg-stone-100"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={CONFIG.MAX_QTY_PER_ITEM}
              value={qty}
              onChange={(e) => handleTyped(e.target.value)}
              aria-label={'Quantity for ' + meal.name}
              className="h-9 w-11 border-x border-stone-300 text-center text-sm font-semibold text-stone-800 outline-none focus:bg-rose-50"
            />
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={'Increase quantity of ' + meal.name}
              className="h-9 w-9 rounded-r-lg text-lg font-bold text-stone-500 transition hover:bg-stone-100"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={isAdding}
            className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {isAdding ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
