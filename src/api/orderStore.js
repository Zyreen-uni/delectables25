import { CONFIG } from '../config.js';
import { ApiError } from '../utils/errors.js';
import { isPositiveInteger, isPositiveNumber } from '../utils/pricing.js';

/*
 * TEMPORARY STORAGE
 * No database. Every order lives in this plain array for as long as the tab
 * stays open. A page refresh clears it.
 *
 * Each function below is async and waits CONFIG.STORE_LATENCY_MS, so the
 * component code treats the store exactly like a remote API: loading states,
 * try/catch, rollback. Swapping in a real backend later only changes this file.
 */
let orders = [];
let nextId = 1;

const ALLOWED_STATUSES = ['pending', 'confirmed'];

/** Promise-based sleep. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fakes a network hop. Fails at CONFIG.STORE_FAILURE_RATE to demo error states. */
async function simulateNetwork(action) {
  await delay(CONFIG.STORE_LATENCY_MS);
  if (Math.random() < CONFIG.STORE_FAILURE_RATE) {
    throw new ApiError('The order store failed to ' + action + '. Try again.', 'STORE', 503);
  }
}

/** Returns a copy so React state never shares an object with the store. */
function clone(order) {
  return { ...order };
}

function findIndexOrThrow(orderId) {
  const index = orders.findIndex((o) => o.id === String(orderId));
  if (index === -1) {
    throw new ApiError('Order ' + orderId + ' was not found.', 'STORE', 404);
  }
  return index;
}

/** Price and quantity must be positive numbers within the cap before any write. */
function assertValidLine(price, quantity) {
  if (!isPositiveNumber(price)) {
    throw new ApiError('Invalid price (' + price + '). Price must be a positive number.', 'VALIDATION');
  }
  if (!isPositiveInteger(quantity)) {
    throw new ApiError('Invalid quantity (' + quantity + '). Use a whole number above 0.', 'VALIDATION');
  }
  if (Number(quantity) > CONFIG.MAX_QTY_PER_ITEM) {
    throw new ApiError('Quantity is capped at ' + CONFIG.MAX_QTY_PER_ITEM + ' per dessert.', 'VALIDATION');
  }
}

/** Keeps only the fields an order line is allowed to hold. */
function toRecord(line) {
  return {
    mealId: String(line.mealId),
    name: line.name,
    price: Number(line.price),
    basePrice: Number(line.basePrice || line.price),
    quantity: Number(line.quantity),
    status: line.status || 'pending',
    thumb: line.thumb || '',
    size: line.size || 'regular',
    notes: line.notes || '',
  };
}

function wrapUnknown(error, message) {
  if (error instanceof ApiError) return error;
  return new ApiError(message, 'STORE');
}

/* [CRUD: READ] Loads every order (cart + history). */
export async function listOrders() {
  try {
    await simulateNetwork('load your orders');
    return orders.map(clone);
  } catch (error) {
    throw wrapUnknown(error, 'Could not load your orders.');
  }
}

/* [CRUD: CREATE] Adds a new line to the cart. */
export async function createOrder(line) {
  assertValidLine(line.price, line.quantity);

  try {
    await simulateNetwork('add that dessert');
    const order = { id: String(nextId), ...toRecord(line), createdAt: Date.now() };
    nextId += 1;
    orders.push(order);
    return clone(order);
  } catch (error) {
    throw wrapUnknown(error, 'Could not add that dessert to your cart.');
  }
}

/* [CRUD: UPDATE] Full replace of one line: quantity, size, notes, price. */
export async function updateOrder(orderId, line) {
  assertValidLine(line.price, line.quantity);

  try {
    await simulateNetwork('save your changes');
    const index = findIndexOrThrow(orderId);
    orders[index] = { ...orders[index], ...toRecord(line), id: orders[index].id };
    return clone(orders[index]);
  } catch (error) {
    throw wrapUnknown(error, 'Could not save your changes to that order line.');
  }
}

/* [CRUD: UPDATE] Partial update of the status field only. */
export async function updateOrderStatus(orderId, nextStatus) {
  if (!ALLOWED_STATUSES.includes(nextStatus)) {
    throw new ApiError('"' + nextStatus + '" is not a valid order status.', 'VALIDATION');
  }

  try {
    await simulateNetwork('update the order status');
    const index = findIndexOrThrow(orderId);
    orders[index] = { ...orders[index], status: nextStatus };
    return clone(orders[index]);
  } catch (error) {
    throw wrapUnknown(error, 'Could not update that order status.');
  }
}

/* [CRUD: DELETE] Removes one line. */
export async function deleteOrder(orderId) {
  try {
    await simulateNetwork('remove that item');
    const index = findIndexOrThrow(orderId);
    orders = orders.filter((_, i) => i !== index);
    return true;
  } catch (error) {
    throw wrapUnknown(error, 'Could not remove that item.');
  }
}
