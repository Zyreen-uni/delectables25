export default function Header({ searchText, searchHint, onSearchChange, onSearchClear, cartCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-xl font-bold text-white shadow-sm">D</span>
          <span>
            <span className="block font-display text-xl font-bold leading-none text-stone-900">Delectables</span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-rose-500">Dessert Ordering</span>
          </span>
        </a>

        {/* Controlled search input. The debounce lives in App.jsx. */}
        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto sm:max-w-md sm:flex-1">
          <label htmlFor="search-input" className="sr-only">Search desserts</label>
          <div className="relative">
            <input
              id="search-input"
              type="search"
              autoComplete="off"
              placeholder="Search desserts: cake, pie, pudding"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchClear();
              }}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 px-3 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <p className="mt-1 h-4 px-1 text-[11px] font-medium text-stone-400" aria-live="polite">{searchHint}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={'Open cart, ' + cartCount + ' items'}
          className="relative ml-auto flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 sm:ml-0"
        >
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-2 ring-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
