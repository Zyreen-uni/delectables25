import { CONFIG } from '../config.js';
import { ApiError } from '../utils/errors.js';
import { mockPriceFor } from '../utils/pricing.js';

/**
 * [ASYNC PATTERN 2] .then() PROMISE CHAINING
 * [ASYNC PATTERN 5] try/catch: the synchronous try/catch guards fetch() itself
 *                   throwing, and .catch() guards the asynchronous rejection.
 *
 * GET {MEALDB}/filter.php?c=Dessert
 * Returns the lightweight list: { idMeal, strMeal, strMealThumb }.
 */
export function fetchDessertCatalog() {
  const url =
    CONFIG.MEALDB_BASE_URL + '/filter.php?c=' + encodeURIComponent(CONFIG.MEALDB_CATEGORY);

  try {
    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new ApiError(
            'TheMealDB responded with ' + response.status + ' ' + response.statusText + '.',
            'MEALDB',
            response.status
          );
        }
        return response.json();
      })
      .then((data) => {
        // TheMealDB answers {"meals": null} when a filter matches nothing.
        const meals = data && Array.isArray(data.meals) ? data.meals : [];
        return meals.map((meal) => ({
          id: meal.idMeal,
          name: meal.strMeal,
          thumb: meal.strMealThumb,
          price: mockPriceFor(meal.idMeal),
        }));
      })
      .catch((error) => {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Could not reach TheMealDB. Check your connection and try again.', 'MEALDB');
      });
  } catch (error) {
    // fetch() threw synchronously (malformed URL, blocked request).
    return Promise.reject(new ApiError('Could not start the request to TheMealDB.', 'MEALDB'));
  }
}

/**
 * [ASYNC PATTERN 3] async/await
 * [ASYNC PATTERN 5] try/catch around the fetch
 *
 * GET {MEALDB}/lookup.php?i=MEAL_ID
 */
export async function fetchMealDetail(mealId) {
  const url = CONFIG.MEALDB_BASE_URL + '/lookup.php?i=' + encodeURIComponent(mealId);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError('TheMealDB lookup failed with ' + response.status + '.', 'MEALDB', response.status);
    }

    const data = await response.json();
    const meal = data && Array.isArray(data.meals) ? data.meals[0] : null;
    if (!meal) {
      throw new ApiError('No dessert found for id ' + mealId + '.', 'MEALDB', 404);
    }

    return {
      id: meal.idMeal,
      name: meal.strMeal,
      thumb: meal.strMealThumb,
      area: meal.strArea || 'International',
      category: meal.strCategory || 'Dessert',
      tags: (meal.strTags || '').split(',').map((t) => t.trim()).filter(Boolean),
      price: mockPriceFor(meal.idMeal),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Could not load details for dessert ' + mealId + '.', 'MEALDB');
  }
}

/**
 * [ASYNC PATTERN 4] Promise.all
 * [ASYNC PATTERN 5] try/catch around the whole batch
 *
 * Every lookup.php request leaves at once instead of one after another,
 * so one slow dessert cannot block the rest.
 */
export async function fetchMealDetailsBatch(mealIds) {
  if (!Array.isArray(mealIds) || mealIds.length === 0) return [];

  try {
    return await Promise.all(mealIds.map((id) => fetchMealDetail(id)));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Could not load the dessert details from TheMealDB.', 'MEALDB');
  }
}
