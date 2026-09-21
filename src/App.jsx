import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from './config.js';
import { fetchDessertCatalog, fetchMealDetailsBatch } from './api/mealdb.js';
import { createOrder, deleteOrder, listOrders, updateOrder, updateOrderStatus } from './api/orderStore.js';
import { debounce } from './utils/debounce.js';
import { sourceLabel } from './utils/errors.js';
import { computeTotals, isPositiveNumber, sizeMultiplier, toCents } from './utils/pricing.js';
import { useBusySet } from './hooks/useBusySet.js';
import { useToasts } from './hooks/useToasts.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import MenuSection from './components/MenuSection.jsx';
import OrderHistory from './components/OrderHistory.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import EditModal from './components/EditModal.jsx';
import ToastStack from './components/ToastStack.jsx';

/* Builds the full record an update needs from an existing line plus overrides. */
function buildLinePayload(item, overrides = {}) {
  const size = overrides.size || item.size || 'regular';
  const basePrice = toCents(item.basePrice || item.price);
  return {
    mealId: item.mealId,
    name: item.name,
    price: toCents(basePrice * sizeMultiplier(size)),
    basePrice,
    quantity: overrides.quantity != null ? Number(overrides.quantity) : item.quantity,
    status: overrides.status || item.status,
    thumb: item.thumb,
    size,
    notes: overrides.notes != null ? overrides.notes : item.notes,
  };
}

export default function App() {
  const { toasts, showToast, dismiss } = useToasts();

  /* ---------- Menu state ---------- */
  const [catalog, setCatalog] = useState([]);
  const [detailCache, setDetailCache] = useState({}); // mealId -> full detail
  const [menuStatus, setMenuStatus] = useState('loading'); // loading | ready | error
  const [menuError, setMenuError] = useState(null);
  const [searchText, setSearchText] = useState(''); // what the input shows
  const [query, setQuery] = useState(''); // what the filter uses (debounced)
  const [visibleCount, setVisibleCount] = useState(CONFIG.MENU_PAGE_SIZE);
  const pendingDetailIds = useRef(new Set());

  /* ---------- Order state (mirror of the in-memory store) ---------- */
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState('loading');
  const [ordersError, setOrdersError] = useState(null);
  const ordersRef = useRef(orders);
  ordersRef.current = orders; // handlers read the latest list, never a stale closure

  const [cartOpen, setCartOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const placingRef = useRef(false);

  const busyOrders = useBusySet(); // order ids with a store call in flight
  const addingMeals = useBusySet(); // meal ids with an add in flight (double-click guard)

  /* ---------- Derived data ---------- */
  const cart = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const history = useMemo(() => orders.filter((o) => o.status !== 'pending'), [orders]);
  const totals = useMemo(() => computeTotals(cart), [cart]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? catalog.filter((meal) => meal.name.toLowerCase().includes(q)) : catalog;
  }, [catalog, query]);

  const visibleIds = useMemo(
    () => matches.slice(0, visibleCount).map((meal) => meal.id),
    [matches, visibleCount]
  );

  /* ---------- Errors ---------- */
  const handleApiError = useCallback(
    (error) => {
      if (error && error.source) {
        showToast(sourceLabel(error.source) + ': ' + error.message, 'error');
      } else {
        showToast('Unexpected error: ' + ((error && error.message) || 'unknown'), 'error');
      }
      if (error) console.error('[Delectables]', error);
    },
    [showToast]
  );

  /* ---------- Menu loading ---------- */

  /* Pulls the catalog once. fetchDessertCatalog() is the .then() chain. */
  const loadMenu = useCallback(async () => {
    setMenuStatus('loading');
    setMenuError(null);
    try {
      const list = await fetchDessertCatalog();
      setCatalog(list);
      setMenuStatus('ready');
    } catch (error) {
      // FAILED REQUEST state, visually distinct from "no matching dessert".
      setMenuError(error);
      setMenuStatus('error');
    }
  }, []);

  /* Hydrates the visible cards with Promise.all whenever the visible slice changes. */
  useEffect(() => {
    if (menuStatus !== 'ready') return;

    const missing = visibleIds.filter(
      (id) => !detailCache[id] && !pendingDetailIds.current.has(id)
    );
    if (!missing.length) return;

    missing.forEach((id) => pendingDetailIds.current.add(id));

    (async () => {
      try {
        // [ASYNC PATTERN 4] Promise.all: every lookup runs in parallel.
        const details = await fetchMealDetailsBatch(missing);
        setDetailCache((prev) => {
          const next = { ...prev };
          details.forEach((d) => {
            next[d.id] = d;
          });
          return next;
        });
      } catch (error) {
        setMenuError(error);
        setMenuStatus('error');
      } finally {
        missing.forEach((id) => pendingDetailIds.current.delete(id));
      }
    })();
  }, [visibleIds, detailCache, menuStatus]);

  /* ---------- Orders loading ---------- */

  /* [CRUD: READ] on first render, after a failed checkout, and on Refresh. */
  const loadOrders = useCallback(async (options = {}) => {
    if (!options.silent) setOrdersStatus('loading');
    try {
      const list = await listOrders();
      setOrders(list);
      setOrdersError(null);
      setOrdersStatus('ready');
    } catch (error) {
      setOrdersError(error);
      setOrdersStatus('error');
    }
  }, []);

  /* Boot: menu and orders load in parallel, neither blocks the other. */
  useEffect(() => {
    loadMenu();
    loadOrders();
  }, [loadMenu, loadOrders]);

  /** Inserts or replaces one order in state without reloading everything. */
  const upsertOrder = useCallback((order) => {
    if (!order) return;
    setOrders((list) => {
      const index = list.findIndex((o) => o.id === order.id);
      if (index === -1) return [...list, order];
      const next = list.slice();
      next[index] = order;
      return next;
    });
  }, []);

  /* ---------- CRUD handlers ---------- */

  /**
   * [CRUD: CREATE] Adds a dessert to the cart.
   * [USER ERROR 1] zero quantity refused
   * [USER ERROR 2] quantity capped at CONFIG.MAX_QTY_PER_ITEM
   * [USER ERROR 3] duplicates bump the existing line instead of a second row
   * [USER ERROR 5] double click guarded by addingMeals
   * [USER ERROR 7] price validated as a positive number
   */
  async function addToCart(meal, requestedQty) {
    if (addingMeals.has(meal.id)) return;

    const qty = Number(requestedQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast('Set a quantity of at least 1 before adding “' + meal.name + '”.', 'warn');
      return;
    }
    if (!Number.isInteger(qty)) {
      showToast('Quantity must be a whole number.', 'warn');
      return;
    }
    if (qty > CONFIG.MAX_QTY_PER_ITEM) {
      showToast('You can order at most ' + CONFIG.MAX_QTY_PER_ITEM + ' of one dessert.', 'warn');
      return;
    }
    if (!isPositiveNumber(meal.price)) {
      showToast('That dessert has an invalid price and cannot be ordered.', 'error');
      return;
    }

    const existing = ordersRef.current.find(
      (line) => line.status === 'pending' && line.mealId === String(meal.id)
    );

    if (existing && existing.quantity >= CONFIG.MAX_QTY_PER_ITEM) {
      showToast('“' + meal.name + '” is already at the ' + CONFIG.MAX_QTY_PER_ITEM + '-item cap.', 'warn');
      return;
    }

    addingMeals.add(meal.id);
    try {
      if (existing) {
        const merged = existing.quantity + qty;
        const capped = Math.min(merged, CONFIG.MAX_QTY_PER_ITEM);
        // [CRUD: UPDATE] bump the existing line instead of creating a twin.
        const updated = await updateOrder(existing.id, buildLinePayload(existing, { quantity: capped }));
        upsertOrder(updated);
        showToast(
          capped < merged
            ? 'Capped “' + meal.name + '” at ' + CONFIG.MAX_QTY_PER_ITEM + '. It was already in your cart.'
            : '“' + meal.name + '” was already in your cart. Quantity is now ' + capped + '.',
          capped < merged ? 'warn' : 'info'
        );
      } else {
        // [CRUD: CREATE] brand new cart line.
        const created = await createOrder({
          mealId: meal.id,
          name: meal.name,
          price: toCents(meal.price),
          basePrice: toCents(meal.price),
          quantity: qty,
          status: 'pending',
          thumb: meal.thumb,
          size: 'regular',
          notes: '',
        });
        upsertOrder(created);
        showToast('Added ' + qty + ' × “' + meal.name + '” to your cart.', 'success');
      }
      setCartOpen(true);
    } catch (error) {
      handleApiError(error);
    } finally {
      addingMeals.remove(meal.id);
    }
  }

  /**
   * [CRUD: UPDATE] Cart stepper. Updates the UI first (live totals), then
   * saves, and rolls back if the store rejects the change.
   */
  async function changeCartQuantity(orderId, delta) {
    const item = ordersRef.current.find((o) => o.id === orderId);
    if (!item || busyOrders.has(orderId)) return;

    const next = item.quantity + delta;
    if (next < CONFIG.MIN_QTY_PER_ITEM) {
      showToast('Use the remove button to remove “' + item.name + '” from the cart.', 'warn');
      return;
    }
    if (next > CONFIG.MAX_QTY_PER_ITEM) {
      showToast('Maximum ' + CONFIG.MAX_QTY_PER_ITEM + ' per dessert.', 'warn');
      return;
    }

    const previous = item.quantity;
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, quantity: next } : o)));

    busyOrders.add(orderId);
    try {
      const updated = await updateOrder(orderId, buildLinePayload(item, { quantity: next }));
      upsertOrder(updated);
    } catch (error) {
      // Roll back so the UI never lies about what the store holds.
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, quantity: previous } : o)));
      handleApiError(error);
    } finally {
      busyOrders.remove(orderId);
    }
  }

  /** [CRUD: UPDATE] Edit modal: quantity, size and notes in one full replace. */
  async function saveOrderEdit(orderId, changes) {
    const item = ordersRef.current.find((o) => o.id === orderId);
    if (!item) return;

    const qty = Number(changes.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setEditError('Quantity must be a whole number of 1 or more.');
      return;
    }
    if (qty > CONFIG.MAX_QTY_PER_ITEM) {
      setEditError('Maximum ' + CONFIG.MAX_QTY_PER_ITEM + ' per dessert.');
      return;
    }

    const payload = buildLinePayload(item, { quantity: qty, size: changes.size, notes: changes.notes });
    if (!isPositiveNumber(payload.price)) {
      setEditError('That size produced an invalid price. Pick another size.');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const updated = await updateOrder(orderId, payload);
      upsertOrder(updated);
      setEditing(null);
      showToast('Updated “' + updated.name + '”.', 'success');
    } catch (error) {
      setEditError(sourceLabel(error.source) + ': ' + error.message);
    } finally {
      setEditSaving(false);
    }
  }

  /** [CRUD: UPDATE] Flips one line between pending and confirmed. */
  async function toggleOrderStatus(orderId) {
    const item = ordersRef.current.find((o) => o.id === orderId);
    if (!item || busyOrders.has(orderId)) return;

    const nextStatus = item.status === 'pending' ? 'confirmed' : 'pending';
    busyOrders.add(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      upsertOrder(updated);
      showToast('“' + updated.name + '” is now ' + updated.status + '.', 'success');
    } catch (error) {
      handleApiError(error);
    } finally {
      busyOrders.remove(orderId);
    }
  }

  /** [CRUD: DELETE] Removes one line. */
  async function removeOrder(orderId) {
    const item = ordersRef.current.find((o) => o.id === orderId);
    if (!item || busyOrders.has(orderId)) return;

    busyOrders.add(orderId);
    try {
      await deleteOrder(orderId);
      setOrders((list) => list.filter((o) => o.id !== orderId));
      showToast('Removed “' + item.name + '”.', 'info');
    } catch (error) {
      handleApiError(error);
    } finally {
      busyOrders.remove(orderId);
    }
  }

  /**
   * Checkout.
   * [USER ERROR 4] blocked on an empty cart
   * [USER ERROR 5] disabled for the whole request, so a double click cannot submit twice
   */
  async function placeOrder() {
    const currentCart = ordersRef.current.filter((o) => o.status === 'pending');
    if (!currentCart.length) {
      showToast('Your cart is empty. Add a dessert before checking out.', 'warn');
      return;
    }
    if (placingRef.current) return;

    placingRef.current = true;
    setIsPlacingOrder(true);
    try {
      // [ASYNC PATTERN 4] Promise.all: every line is confirmed in parallel.
      const confirmed = await Promise.all(
        currentCart.map((line) => updateOrderStatus(line.id, 'confirmed'))
      );
      confirmed.forEach(upsertOrder);
      setCartOpen(false);
      showToast('Order placed. ' + confirmed.length + ' item(s) confirmed.', 'success');
    } catch (error) {
      handleApiError(error);
      await loadOrders({ silent: true }); // re-sync in case some lines went through
    } finally {
      placingRef.current = false;
      setIsPlacingOrder(false);
    }
  }

  /* ---------- Search (debounced) ---------- */

  // Created once. setState functions are stable, so the closure never goes stale.
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setQuery(value);
        setVisibleCount(CONFIG.MENU_PAGE_SIZE);
      }, CONFIG.SEARCH_DEBOUNCE_MS),
    []
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  function handleSearchChange(value) {
    setSearchText(value); // the input updates on every key
    debouncedSearch(value); // the filter runs once typing pauses
  }

  function clearSearch() {
    debouncedSearch.cancel();
    setSearchText('');
    setQuery('');
    setVisibleCount(CONFIG.MENU_PAGE_SIZE);
  }

  const searchHint = !searchText.trim()
    ? ''
    : searchText !== query
      ? 'Typing…'
      : 'Results for “' + query.trim() + '”';

  /* ---------- Global keyboard + scroll lock ---------- */
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      if (editing) setEditing(null);
      else setCartOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editing]);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', cartOpen);
  }, [cartOpen]);

  /* ---------- Render ---------- */
  return (
    <>
      <Header
        searchText={searchText}
        searchHint={searchHint}
        onSearchChange={handleSearchChange}
        onSearchClear={clearSearch}
        cartCount={totals.itemCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <Hero />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <MenuSection
          status={menuStatus}
          error={menuError}
          query={query}
          visibleIds={visibleIds}
          detailCache={detailCache}
          totalMatches={matches.length}
          hasMore={matches.length > visibleCount}
          onLoadMore={() => setVisibleCount((n) => n + CONFIG.MENU_PAGE_SIZE)}
          onRetry={loadMenu}
          onClearSearch={clearSearch}
          isAdding={addingMeals.has}
          onAdd={addToCart}
          onWarn={(message) => showToast(message, 'warn')}
        />

        <OrderHistory
          orders={history}
          status={ordersStatus}
          error={ordersError}
          isBusy={busyOrders.has}
          onRefresh={() => loadOrders()}
          onReopen={toggleOrderStatus}
          onDelete={removeOrder}
        />
      </main>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totals={totals}
        status={ordersStatus}
        error={ordersError}
        onRetry={() => loadOrders()}
        isBusy={busyOrders.has}
        isPlacingOrder={isPlacingOrder}
        onPlaceOrder={placeOrder}
        onIncrease={(id) => changeCartQuantity(id, 1)}
        onDecrease={(id) => changeCartQuantity(id, -1)}
        onEdit={(item) => {
          setEditError('');
          setEditing(item);
        }}
        onToggle={toggleOrderStatus}
        onRemove={removeOrder}
      />

      {editing && (
        <EditModal
          key={editing.id}
          order={editing}
          error={editError}
          isSaving={editSaving}
          onSave={saveOrderEdit}
          onCancel={() => setEditing(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
