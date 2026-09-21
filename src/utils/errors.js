/**
 * One error type for the whole app, tagged with WHERE it came from, so the UI
 * shows a different message for "the dessert API is down" and "the order
 * store failed".
 */
export class ApiError extends Error {
  constructor(message, source, status) {
    super(message);
    this.name = 'ApiError';
    this.source = source; // 'MEALDB' | 'STORE' | 'VALIDATION'
    this.status = status || 0;
  }
}

export function sourceLabel(source) {
  if (source === 'MEALDB') return 'TheMealDB';
  if (source === 'STORE') return 'Order store';
  return 'Delectables';
}
