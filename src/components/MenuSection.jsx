import DessertCard from './DessertCard.jsx';
import { sourceLabel } from '../utils/errors.js';

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
      <div className="h-44 w-full bg-stone-200"></div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-stone-200"></div>
        <div className="h-3 w-1/2 rounded bg-stone-200"></div>
        <div className="h-9 w-full rounded-lg bg-stone-200"></div>
      </div>
    </div>
  );
}

/* EMPTY STATE: the request worked, nothing matched. Neutral, no retry. */
function EmptyPanel({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
      <h3 className="font-display text-xl font-semibold text-stone-800">No matching dessert</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
        Nothing on the menu matches <span className="font-semibold text-stone-700">“{query}”</span>. Try a shorter
        word, such as cake, pie, or pudding.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
      >
        Clear search
      </button>
    </div>
  );
}

/* ERROR STATE: the request failed. Red, names the service, offers a retry. */
function ErrorPanel({ error, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-14 text-center">
      <h3 className="font-display text-xl font-semibold text-rose-900">Could not load the menu</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-rose-500">
        Source: {sourceLabel(error && error.source)}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-rose-700">{(error && error.message) || 'Something went wrong.'}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Try again
      </button>
    </div>
  );
}

export default function MenuSection({
  status, // 'loading' | 'ready' | 'error'
  error,
  query,
  visibleIds,
  detailCache,
  totalMatches,
  hasMore,
  onLoadMore,
  onRetry,
  onClearSearch,
  isAdding,
  onAdd,
  onWarn,
}) {
  let countText = '';
  let body = null;

  if (status === 'loading') {
    countText = 'Loading desserts…';
    body = (
      <Grid>
        {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
      </Grid>
    );
  } else if (status === 'error') {
    countText = 'Unavailable';
    body = <ErrorPanel error={error} onRetry={onRetry} />;
  } else if (totalMatches === 0) {
    countText = '0 desserts';
    body = <EmptyPanel query={query.trim() || 'Dessert'} onClear={onClearSearch} />;
  } else {
    const shown = visibleIds.length;
    countText =
      shown === totalMatches
        ? shown + ' dessert' + (shown === 1 ? '' : 's')
        : 'Showing ' + shown + ' of ' + totalMatches + ' desserts';

    body = (
      <>
        <Grid>
          {visibleIds.map((id) =>
            detailCache[id] ? (
              <DessertCard
                key={id}
                meal={detailCache[id]}
                isAdding={isAdding(id)}
                onAdd={onAdd}
                onWarn={onWarn}
              />
            ) : (
              // LOADING STATE per card while its details are in flight.
              <SkeletonCard key={id} />
            )
          )}
        </Grid>
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onLoadMore}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-100"
            >
              Load more desserts
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="mt-10" aria-labelledby="menu-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
        <h2 id="menu-heading" className="font-display text-2xl font-bold text-stone-900">Dessert Menu</h2>
        <p className="text-sm font-medium text-stone-500" aria-live="polite">{countText}</p>
      </div>
      <div className="mt-6">{body}</div>
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
