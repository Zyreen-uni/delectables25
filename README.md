# Delectables (React)

A dessert ordering CRUD app built with **React 18 + Vite**. This is the React conversion of the vanilla JavaScript version.

- **Menu** comes from [TheMealDB](https://www.themealdb.com/api.php) (`Dessert` category).
- **Cart and order history** live in a plain JavaScript array inside `src/api/orderStore.js`. No database. A page refresh clears every order.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo at vercel.com/new. Vercel detects **Vite** automatically.
3. Build command `npm run build`, output directory `dist`. Deploy.

## File structure

| File | Responsibility |
|------|----------------|
| `src/App.jsx` | All state, CRUD handlers, debounce wiring, boot |
| `src/api/mealdb.js` | TheMealDB fetches (`.then` chain, async/await, `Promise.all`) |
| `src/api/orderStore.js` | Temporary storage: a plain array with async CRUD functions |
| `src/utils/debounce.js` | Callback-based debounce |
| `src/utils/pricing.js` | Mock prices, validation, money formatting, totals |
| `src/utils/errors.js` | `ApiError` tagged with its source |
| `src/hooks/useBusySet.js` | Tracks ids with work in flight (double click guard) |
| `src/hooks/useToasts.js` | Toast queue |
| `src/components/*` | Header, Hero, MenuSection, DessertCard, CartDrawer, OrderHistory, EditModal, StatusBadge, ToastStack |

## CRUD map (all in `src/api/orderStore.js`)

| Operation | Function | Triggered by |
|-----------|----------|--------------|
| Create | `createOrder()` | Add to Cart on a new dessert |
| Read | `listOrders()` | First load, Refresh button, failed checkout re-sync |
| Update (full) | `updateOrder()` | Cart stepper, edit modal, adding a dessert already in the cart |
| Update (status) | `updateOrderStatus()` | In the cart, in history, Place Order |
| Delete | `deleteOrder()` | In the cart or history |

Every store function waits `CONFIG.STORE_LATENCY_MS` before answering, so the components handle it like a real API: loading states, try/catch, and rollback. Set `CONFIG.STORE_FAILURE_RATE` to `0.3` in `src/config.js` to demo the error states live.

## Async patterns

| # | Pattern | Where |
|---|---------|-------|
| 1 | Callback-based **debounce** | `src/utils/debounce.js`, used for the search box in `App.jsx` |
| 2 | **`.then()` chaining** | `fetchDessertCatalog()` in `src/api/mealdb.js` |
| 3 | **async/await** | `fetchMealDetail()` and every function in `orderStore.js` |
| 4 | **`Promise.all`** | `fetchMealDetailsBatch()` hydrates the grid, `placeOrder()` confirms every line |
| 5 | **try/catch** | Around every fetch and every store call |

Search the source for `[ASYNC PATTERN` and `[CRUD:` to jump between them.

## React concepts used

- `useState` for menu, orders, cart drawer, modal, and toasts
- `useEffect` for boot loading, detail hydration, the Escape key, and scroll lock
- `useMemo` for derived data: cart, history, totals, search matches
- `useCallback` and `useRef` for stable handlers and synchronous guards
- Custom hooks: `useBusySet`, `useToasts`
- Props and lifted state: `App.jsx` owns the data, components only render and call handlers
- Controlled inputs: search box, card quantity, edit form
- `key` on lists, and `key={order.id}` on the modal so each open starts fresh

## User error handling

| Guard | Behaviour |
|-------|-----------|
| Zero quantity | Blocked with a message. The cart stepper stops at 1. |
| Quantity cap | 10 per dessert, enforced at the card, the cart, the edit modal, and the store |
| Duplicates | Adding a dessert already in the cart bumps the existing line |
| Double click on Add | Ignored while the first add is in flight |
| Empty cart | Place Order is disabled, and a toast fires if reached anyway |
| Double submit | Place Order is disabled for the whole request, with a spinner |
| Failure source | TheMealDB errors and order store errors show different, named messages |
| Price validation | Price and quantity are checked as positive numbers before every write |
| Optimistic update | Cart quantity changes show first, then roll back if the store fails |

## Pricing

TheMealDB has no prices. `mockPriceFor()` derives a stable price between $4.50 and $12.40 from the meal id. Sizes multiply the base price: Large ×1.5, Sharing Platter ×2.25. Checkout adds a 5% service fee.
