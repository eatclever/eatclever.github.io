/**
 * Test: Nutrition data logic and value ranges
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf-8'));

function run() {
  const results = [];
  function test(name, fn) {
    try { fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, error: e.message }); }
  }

  const foods = load('data/foods.json');
  const nutrients = load('data/nutrients.json');
  const ageGroups = load('data/age-groups.json');
  const recipes = load('data/recipes.json');
  const restaurant = load('data/restaurant-guide.json');
  const shopping = load('data/shopping.json');

  // Calorie ranges
  test('foods: calories are in reasonable range (0-900 kcal/100g)', () => {
    const bad = [];
    for (const f of foods) {
      if (f.calories < 0 || f.calories > 900) bad.push(`${f.id}: ${f.calories}`);
    }
    if (bad.length > 0) throw new Error(`Out of range: ${bad.join(', ')}`);
  });

  // Nutrient values non-negative
  test('foods: all nutrient values are non-negative', () => {
    const bad = [];
    for (const f of foods) {
      for (const [k, v] of Object.entries(f.nutrients)) {
        if (v < 0) bad.push(`${f.id}.${k}: ${v}`);
      }
    }
    if (bad.length > 0) throw new Error(`Negative values: ${bad.slice(0, 5).join(', ')}`);
  });

  // RDA values positive
  test('nutrients: RDA values are positive for all age groups', () => {
    const bad = [];
    for (const [id, n] of Object.entries(nutrients)) {
      for (const [ag, val] of Object.entries(n.rda)) {
        if (val <= 0) bad.push(`${id}.rda.${ag}: ${val}`);
      }
    }
    if (bad.length > 0) throw new Error(`Non-positive RDAs: ${bad.join(', ')}`);
  });

  // Cost tiers valid
  test('foods: cost_tier is 1, 2, or 3', () => {
    const bad = [];
    for (const f of foods) {
      if (![1, 2, 3].includes(f.cost_tier)) bad.push(`${f.id}: ${f.cost_tier}`);
    }
    if (bad.length > 0) throw new Error(`Invalid cost tiers: ${bad.join(', ')}`);
  });

  // Age group calorie ranges logical
  test('age-groups: calorie ranges are logical (min < max)', () => {
    const bad = [];
    for (const ag of ageGroups) {
      for (const sub of (ag.sub_groups || [])) {
        const cal = sub.daily_calories;
        if (cal && cal.min >= cal.max) {
          bad.push(`${ag.id}/${sub.id}: ${cal.min}-${cal.max}`);
        }
      }
    }
    if (bad.length > 0) throw new Error(`Invalid ranges: ${bad.join(', ')}`);
  });

  // Recipe cook times match categories
  test('recipes: cook_time_min matches cook_time_cat', () => {
    const bad = [];
    for (const r of recipes) {
      const min = r.cook_time_min;
      const cat = r.cook_time_cat;
      if (cat === 'quick' && min > 15) bad.push(`${r.id}: ${min}min tagged quick`);
      if (cat === 'medium' && (min < 10 || min > 45)) bad.push(`${r.id}: ${min}min tagged medium`);
      if (cat === 'long' && min < 25) bad.push(`${r.id}: ${min}min tagged long`);
    }
    if (bad.length > 0) throw new Error(`Mismatched: ${bad.join(', ')}`);
  });

  // Recipe calories positive
  test('recipes: total calories are positive', () => {
    const bad = [];
    for (const r of recipes) {
      if (!r.total_nutrients || r.total_nutrients.calories <= 0) {
        bad.push(`${r.id}: ${r.total_nutrients?.calories}`);
      }
    }
    if (bad.length > 0) throw new Error(`Invalid calories: ${bad.join(', ')}`);
  });

  // Restaurant savings percentages
  test('restaurant-guide: savings_pct values are 0-100', () => {
    const bad = [];
    for (const r of restaurant) {
      for (const [k, v] of Object.entries(r.savings_pct || {})) {
        if (v < 0 || v > 100) bad.push(`${r.id}.${k}: ${v}`);
      }
    }
    if (bad.length > 0) throw new Error(`Out of range: ${bad.join(', ')}`);
  });

  // Shopping plan costs
  test('shopping: budget < moderate < premium total costs', () => {
    const plans = shopping.weekly_plans || [];
    const costs = plans.map(p => ({ id: p.id, tier: p.budget_tier, cost: p.total_cost_usd }));
    costs.sort((a, b) => a.tier - b.tier);
    for (let i = 1; i < costs.length; i++) {
      if (costs[i].cost <= costs[i - 1].cost) {
        throw new Error(`Tier ${costs[i].tier} ($${costs[i].cost}) not > tier ${costs[i - 1].tier} ($${costs[i - 1].cost})`);
      }
    }
  });

  // Nutrient colors are valid hex
  test('nutrients: colors are valid hex codes', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const bad = [];
    for (const [id, n] of Object.entries(nutrients)) {
      if (!hexRegex.test(n.color)) bad.push(`${id}: ${n.color}`);
    }
    if (bad.length > 0) throw new Error(`Invalid hex: ${bad.join(', ')}`);
  });

  // Serving sizes positive
  test('foods: serving_g values are positive', () => {
    const bad = [];
    for (const f of foods) {
      if (f.serving_g <= 0) bad.push(`${f.id}: ${f.serving_g}`);
    }
    if (bad.length > 0) throw new Error(`Invalid serving sizes: ${bad.join(', ')}`);
  });

  return results;
}

module.exports = { run };
