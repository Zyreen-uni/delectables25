export const CONFIG = {
  // TheMealDB public test key endpoints (menu source).
  MEALDB_BASE_URL: 'https://www.themealdb.com/api/json/v1/1',
  MEALDB_CATEGORY: 'Dessert',

  // Business rules.
  MAX_QTY_PER_ITEM: 10,
  MIN_QTY_PER_ITEM: 1,
  SERVICE_FEE_RATE: 0.05,

  // How many dessert cards to show per "Load more" step.
  MENU_PAGE_SIZE: 12,

  // Debounce window (ms) for the menu search input.
  SEARCH_DEBOUNCE_MS: 350,

  // In-memory order store. No database: the store is a plain array.
  // STORE_LATENCY_MS fakes a network round trip so the async patterns stay real.
  // Set STORE_FAILURE_RATE to 0.3 during a demo to show the error states.
  STORE_LATENCY_MS: 300,
  STORE_FAILURE_RATE: 0,

  // Size options for the edit (update) flow. Multiplier applies to price.
  SIZES: [
    { id: 'regular', label: 'Regular', multiplier: 1 },
    { id: 'large', label: 'Large', multiplier: 1.5 },
    { id: 'sharing', label: 'Sharing Platter', multiplier: 2.25 },
  ],
};
