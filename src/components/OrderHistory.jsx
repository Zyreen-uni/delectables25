import { sourceLabel } from '../utils/errors.js';
import { formatMoney, sizeLabel } from '../utils/pricing.js';
import StatusBadge from './StatusBadge.jsx';

export default function OrderHistory({ orders, status, error, isBusy, onRefresh, onReopen, onDelete }) {
  let countText = orders.length + ' order' + (orders.length === 1 ? '' : 's');
  let body;

  if (status === 'loading') {
    countText = 'Loading…';
    body = (
      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-6 text-sm text-stone-500 ring-1 ring-stone-200">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600"></span>
        Loading your order history…
      </div>
    );
  } else if (status === 'error') {
    countText = 'Unavailable';
    body = (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-rose-900">Could not load order history</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
          Source: {sourceLabel(error && error.source)}
        </p>
        <p className="mt-2 text-sm text-rose-700">{error && error.message}</p>
      </div>
    );
  } else if (orders.length === 0) {
    body = (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center">
        <p className="mt-2 text-sm text-stone-500">No confirmed orders yet. Place one and it will show up here.</p>
      </div>
    );
  } else {
    body = (
      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className={
              'flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 ' +
              (isBusy(order.id) ? 'opacity-60' : '')
            }
          >
            <img src={order.thumb} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-stone-200" />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-stone-900">{order.name}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={order.status} />
                <span className="text-[11px] text-stone-500">
                  {order.quantity} × {formatMoney(order.price)}, {sizeLabel(order.size)}
                </span>
              </div>
              {order.notes && <p className="mt-1 truncate text-[11px] italic text-stone-500">“{order.notes}”</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-bold text-stone-900">{formatMoney(order.price * order.quantity)}</span>
              <button
                type="button"
                onClick={() => onReopen(order.id)}
                disabled={isBusy(order.id)}
                title="Move back to cart"
                aria-label={'Move ' + order.name + ' back to cart'}
                className="rounded-md p-1.5 text-stone-400 transition hover:bg-amber-50 hover:text-amber-700"
              >
                Reopen
              </button>
              <button
                type="button"
                onClick={() => onDelete(order.id)}
                disabled={isBusy(order.id)}
                title="Delete order"
                aria-label={'Delete ' + order.name}
                className="rounded-md p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="mt-16" aria-labelledby="history-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
        <h2 id="history-heading" className="font-display text-2xl font-bold text-stone-900">Order History</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-stone-500">{countText}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 ring-1 ring-stone-300 transition hover:bg-stone-100"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="mt-6">{body}</div>
    </section>
  );
}
