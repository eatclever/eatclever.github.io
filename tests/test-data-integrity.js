/**
 * Test: Cross-file data consistency
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf-8'));

const NUTRIENT_KEYS = [
  'protein', 'fat', 'carbs', 'fiber', 'vitamin_a', 'vitamin_b12',
  'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'calcium',
  'iron', 'magnesium', 'potassium', 'zinc', 'selenium', 'omega_3', 'folate'
];

const AGE_GROUPS = ['children', 'teens', 'adults', 'seniors'];
const LANG_CODES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ro', 'ru', 'zh', 'ja', 'ar', 'hi'];

function run() {
  const results = [];
  function test(name, fn) {
    try { fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, error: e.message }); }
  }

  const foods = load('data/foods.json');
  const nutrients = load('data/nutrients.json');
  const categories = load('data/categories.json');
  const ageGroups = load('data/age-groups.json');
  const recipes = load('data/recipes.json');
  const supplements = load('data/supplements.json');
  const restaurant = load('data/restaurant-guide.json');
  const shopping = load('data/shopping.json');

  const foodIds = new Set(foods.map(f => f.id));
  const recipeIds = new Set(recipes.map(r => r.id));

  // Foods
  test('foods: all have required fields', () => {
    for (const f of foods) {
      for (const field of ['id', 'name', 'category', 'calories', 'nutrients', 'serving_g', 'cost_tier']) {
        if (f[field] === undefined) throw new Error(`Food "${f.id}" missing field "${field}"`);
      }
    }
  });

  test('foods: all have 18 nutrient keys', () => {
    for (const f of foods) {
      for (const k of NUTRIENT_KEYS) {
        if (f.nutrients[k] === undefined) throw new Error(`Food "${f.id}" missing nutrient "${k}"`);
      }
    }
  });

  test('foods: all have names in 12 languages', () => {
    const missing = [];
    for (const f of foods) {
      for (const lang of LANG_CODES) {
        if (!f.name[lang]) missing.push(`${f.id}.name.${lang}`);
      }
    }
    if (missing.length > 0) throw new Error(`Missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ''}`);
  });

  test('foods: unique IDs', () => {
    const seen = new Set();
    for (const f of foods) {
      if (seen.has(f.id)) throw new Error(`Duplicate food ID: ${f.id}`);
      seen.add(f.id);
    }
  });

  // Nutrients
  test('nutrients: all 18 present with required fields', () => {
    for (const k of NUTRIENT_KEYS) {
      const n = nutrients[k];
      if (!n) throw new Error(`Missing nutrient: ${k}`);
      for (const field of ['name_key', 'unit', 'rda', 'color']) {
        if (!n[field]) throw new Error(`Nutrient "${k}" missing "${field}"`);
      }
      for (const ag of AGE_GROUPS) {
        if (n.rda[ag] === undefined) throw new Error(`Nutrient "${k}" missing RDA for "${ag}"`);
      }
    }
  });

  // Categories
  test('categories: exactly 6 with valid pages', () => {
    if (categories.length !== 6) throw new Error(`Expected 6 categories, got ${categories.length}`);
    for (const c of categories) {
      const pagePath = path.join(ROOT, c.page);
      if (!fs.existsSync(pagePath)) throw new Error(`Category "${c.id}" page "${c.page}" not found`);
    }
  });

  // Age groups
  test('age-groups: 4 groups, sub_groups reference valid foods', () => {
    if (ageGroups.length !== 4) throw new Error(`Expected 4 age groups, got ${ageGroups.length}`);
    const badRefs = [];
    for (const ag of ageGroups) {
      for (const sub of (ag.sub_groups || [])) {
        for (const fid of (sub.key_foods || [])) {
          if (!foodIds.has(fid)) badRefs.push(`${ag.id}/${sub.id} -> ${fid}`);
        }
      }
    }
    if (badRefs.length > 0) throw new Error(`Invalid food refs: ${badRefs.slice(0, 5).join(', ')}`);
  });

  // Recipes
  test('recipes: all ingredients reference valid foods', () => {
    const bad = [];
    for (const r of recipes) {
      for (const ing of (r.ingredients || [])) {
        if (!foodIds.has(ing.food_id)) bad.push(`${r.id} -> ${ing.food_id}`);
      }
    }
    if (bad.length > 0) throw new Error(`Invalid food refs: ${bad.slice(0, 5).join(', ')}`);
  });

  test('recipes: valid meal_type and cook_time_cat', () => {
    const validMeals = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
    const validTimes = new Set(['quick', 'medium', 'long']);
    for (const r of recipes) {
      if (!validMeals.has(r.meal_type)) throw new Error(`Recipe "${r.id}" invalid meal_type: ${r.meal_type}`);
      if (!validTimes.has(r.cook_time_cat)) throw new Error(`Recipe "${r.id}" invalid cook_time_cat: ${r.cook_time_cat}`);
    }
  });

  // Supplements
  test('supplements: food alternatives reference valid foods', () => {
    const bad = [];
    for (const s of supplements) {
      for (const alt of (s.food_alternatives || [])) {
        if (!foodIds.has(alt.food_id)) bad.push(`${s.id} -> ${alt.food_id}`);
      }
    }
    if (bad.length > 0) throw new Error(`Invalid food refs: ${bad.slice(0, 5).join(', ')}`);
  });

  // Restaurant guide
  test('restaurant-guide: all entries have required fields', () => {
    for (const r of restaurant) {
      if (!r.restaurant_option) throw new Error(`Entry "${r.id}" missing restaurant_option`);
      if (!r.home_option) throw new Error(`Entry "${r.id}" missing home_option`);
      for (const field of ['calories', 'protein', 'fat', 'sodium']) {
        if (r.restaurant_option[field] === undefined) throw new Error(`Entry "${r.id}" restaurant_option missing "${field}"`);
        if (r.home_option[field] === undefined) throw new Error(`Entry "${r.id}" home_option missing "${field}"`);
      }
    }
  });

  // Shopping
  test('shopping: recipe IDs in plans exist', () => {
    const bad = [];
    for (const plan of (shopping.weekly_plans || [])) {
      for (const day of (plan.days || [])) {
        for (const [slot, rid] of Object.entries(day.meals || {})) {
          if (!recipeIds.has(rid)) bad.push(`plan ${plan.id} day ${day.day} ${slot} -> ${rid}`);
        }
      }
    }
    if (bad.length > 0) throw new Error(`Invalid recipe refs: ${bad.slice(0, 5).join(', ')}`);
  });

  test('shopping: food IDs in shopping lists exist', () => {
    const bad = [];
    for (const plan of (shopping.weekly_plans || [])) {
      for (const item of (plan.shopping_list || [])) {
        if (!foodIds.has(item.food_id)) bad.push(`plan ${plan.id} -> ${item.food_id}`);
      }
    }
    if (bad.length > 0) throw new Error(`Invalid food refs: ${bad.slice(0, 5).join(', ')}`);
  });

  return results;
}

module.exports = { run };
