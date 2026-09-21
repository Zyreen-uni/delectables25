import { CONFIG } from '../config.js';
import { sourceLabel } from '../utils/errors.js';
import { formatMoney, sizeLabel } from '../utils/pricing.js';
import StatusBadge from './StatusBadge.jsx';

function CartRow({ item, isBusy, onIncrease, onDecrease, onEdit, onToggle, onRemove }) {
  const atCap = item.quantity >= CONFIG.MAX_QTY_PER_ITEM;

  return (
    <li className={'flex gap-3 border-b border-stone-100 p-4 transition ' + (isBusy ? 'opacity-60' : '')}>
      <img src={item.thumb} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-stone-200" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-sm font-semibold text-stone-900">{item.name}</h4>
          {/* Line total recalculates on every render: no page reload. */}
          <span className="shrink-0 text-sm font-bold text-stone-900">{formatMoney(item.price * item.quantity)}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            {sizeLabel(item.size)}
          </span>
          <span className="text-[11px] text-stone-400">{formatMoney(item.price)} ea</span>
        </div>

        {item.notes && <p className="mt-1.5 truncate text-[11px] italic text-stone-500">“{item.notes}”</p>}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-lg ring-1 ring-stone-300">
            <button
              type="button"
              onClick={onDecrease}
              disabled={isBusy}
              aria-label={'Decrease cart quantity of ' + item.name}
              className="h-7 w-7 rounded-l-lg text-base font-bold text-stone-500 transition hover:bg-stone-100"
            >
              −
            </button>
            <span className="w-8 border-x border-stone-300 text-center text-xs font-semibold text-stone-800">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={isBusy}
              aria-label={'Increase cart quantity of ' + item.name}
              className={
                'h-7 w-7 rounded-r-lg text-base font-bold transition ' +
                (atCap ? 'cursor-not-allowed text-stone-300' : 'text-stone-500 hover:bg-stone-100')
              }
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              disabled={isBusy}
              title="Edit line"
              aria-label={'Edit ' + item.name}
              className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onToggle}
              disabled={isBusy}
              title="Confirm this line"
              aria-label={'Confirm ' + item.name}
              className="rounded-md p-1.5 text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={isBusy}
              title="Remove"
              aria-label={'Remove ' + item.name}
              className="rounded-md p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  totals,
  status, // 'loading' | 'ready' | 'error'
  error,
  onRetry,
  isBusy,
  isPlacingOrder,
  onPlaceOrder,
  onIncrease,
  onDecrease,
  onEdit,
  onToggle,
  onRemove,
}) {
  let body;
  if (status === 'error') {
    body = (
      <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
        <h3 className="mt-2 font-display text-base font-semibold text-rose-900">Cart unavailable</h3>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
          Source: {sourceLabel(error && error.source)}
        </p>
        <p className="mt-2 text-sm text-rose-700">{error && error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Reload cart
        </button>
      </div>
    );
  } else if (status === 'ready' && cart.length === 0) {
    body = (
      <div className="px-6 py-16 text-center">
        <h3 className="font-display text-lg font-semibold text-stone-800">Your cart is empty</h3>
        <p className="mt-1 text-sm text-stone-500">Pick something sweet from the menu to get started.</p>
      </div>
    );
  } else {
    body = (
      <ul>
        {cart.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            isBusy={isBusy(item.id)}
            onIncrease={() => onIncrease(item.id)}
            onDecrease={() => onDecrease(item.id)}
            onEdit={() => onEdit(item)}
            onToggle={() => onToggle(item.id)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </ul>
    );
  }

  const canCheckout = status === 'ready' && cart.length > 0 && !isPlacingOrder;

  return (
    <>
      <div
        onClick={onClose}
        className={'fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm ' + (isOpen ? '' : 'hidden')}
        aria-hidden="true"
      ></div>

      <aside
        className={
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ' +
          (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">Your Cart</h2>
            <p className="text-xs text-stone-500">
              {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          >
            Close
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto">
          {body}
          {/* LOADING STATE: translucent overlay while the store answers. */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-rose-600"></span>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 bg-stone-50 px-5 py-4">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone-600">
              <dt>Service fee ({Math.round(CONFIG.SERVICE_FEE_RATE * 100)}%)</dt>
              <dd>{formatMoney(totals.serviceFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          {/* Disabled on an empty cart and for the whole request (no double submit). */}
          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={!canCheckout}
            className="mt-4 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isPlacingOrder ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                Placing order…
              </span>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
