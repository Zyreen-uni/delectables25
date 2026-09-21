import { CONFIG } from '../config.js';

/* TheMealDB ships no prices, so a stable price is derived from the meal id.
 * The same dessert gets the same price on every reload. Range: $4.50 to $12.40. */
export function mockPriceFor(mealId) {
  const seed = String(mealId)
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const price = 4.5 + ((seed * 7) % 80) / 10;
  return Math.round(price * 100) / 100;
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

/* Rounds to cents so floating point never leaks into a price. */
export function toCents(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function sizeLabel(sizeId) {
  const match = CONFIG.SIZES.find((s) => s.id === sizeId);
  return match ? match.label : 'Regular';
}

export function sizeMultiplier(sizeId) {
  const match = CONFIG.SIZES.find((s) => s.id === sizeId);
  return match ? match.multiplier : 1;
}

export function formatMoney(amount) {
  const n = Number(amount);
  return '$' + (Number.isFinite(n) ? n : 0).toFixed(2);
}

/* Cart totals, shared by the drawer and the header badge. */
export function computeTotals(items) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceFee = subtotal > 0 ? toCents(subtotal * CONFIG.SERVICE_FEE_RATE) : 0;
  return { itemCount, subtotal, serviceFee, total: subtotal + serviceFee };
}
