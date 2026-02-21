/**
 * data.js - Data loader and cache for EatWise
 * Fetches and caches all nutrition data JSON files
 */
const Data = (() => {
  let _foods = null;
  let _categories = null;
  let _nutrients = null;
  let _supplements = null;
  let _ageGroups = null;
  let _recipes = null;
  let _restaurantGuide = null;
  let _shopping = null;

  async function _load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    return resp.json();
  }

  async function _loadSafe(url) {
    try { return await _load(url); } catch(e) { console.warn('Optional data not loaded:', url); return null; }
  }

  async function init() {
    if (!_foods || !_categories) {
      const [foods, categories, nutrients, supplements, ageGroups, recipes, restaurantGuide, shopping] = await Promise.all([
        _load('data/foods.json'),
        _load('data/categories.json'),
        _load('data/nutrients.json'),
        _loadSafe('data/supplements.json'),
        _loadSafe('data/age-groups.json'),
        _loadSafe('data/recipes.json'),
        _loadSafe('data/restaurant-guide.json'),
        _loadSafe('data/shopping.json')
      ]);
      _foods = foods;
      _categories = categories;
      _nutrients = nutrients;
      _supplements = supplements;
      _ageGroups = ageGroups;
      _recipes = recipes;
      _restaurantGuide = restaurantGuide;
      _shopping = shopping;
    }
  }

  // Foods
  function getAllFoods() { return _foods || []; }
  function getFood(id) { return (_foods || []).find(f => f.id === id) || null; }
  function getFoodsByCategory(cat) { return (_foods || []).filter(f => f.category === cat); }
  function getFoodsByTag(tag) { return (_foods || []).filter(f => f.tags && f.tags.includes(tag)); }
  function getFoodsByGrocerySection(section) { return (_foods || []).filter(f => f.grocery_section === section); }
  function getFruitsByClass(cls) { return (_foods || []).filter(f => f.fruit_class === cls); }

  // Categories
  function getCategories() { return _categories || []; }
  function getCategory(id) { return (_categories || []).find(c => c.id === id) || null; }

  // Nutrients
  function getNutrients() { return _nutrients || {}; }
  function getNutrient(id) { return (_nutrients || {})[id] || null; }

  // Supplements
  function getSupplements() { return _supplements || []; }
  function getSupplement(id) { return (_supplements || []).find(s => s.id === id) || null; }

  // Age Groups
  function getAgeGroups() { return _ageGroups || []; }
  function getAgeGroup(id) { return (_ageGroups || []).find(g => g.id === id) || null; }

  // Recipes
  function getRecipes() { return _recipes || []; }
  function getRecipe(id) { return (_recipes || []).find(r => r.id === id) || null; }
  function getRecipesByTime(cat) { return (_recipes || []).filter(r => r.cook_time_cat === cat); }
  function getRecipesByMeal(type) { return (_recipes || []).filter(r => r.meal_type === type); }
  function getRecipesForFood(foodId) {
    return (_recipes || []).filter(r => r.ingredients && r.ingredients.some(i => i.food_id === foodId));
  }

  // Restaurant Guide
  function getRestaurantGuide() { return _restaurantGuide || []; }
  function getRestaurantByCategory(cat) { return (_restaurantGuide || []).filter(r => r.category === cat); }

  // Shopping
  function getShopping() { return _shopping || {}; }
  function getWeeklyPlans() { return (_shopping && _shopping.weekly_plans) || []; }
  function getWeeklyPlan(id) { return ((_shopping && _shopping.weekly_plans) || []).find(p => p.id === id) || null; }

  // Nutrient scoring
  function getNutrientScore(food, nutrientId, ageGroup) {
    ageGroup = ageGroup || 'adults';
    const nutrient = getNutrient(nutrientId);
    if (!nutrient || !food.nutrients[nutrientId]) return 0;
    const rda = nutrient.rda[ageGroup] || nutrient.rda.adults;
    if (!rda) return 0;
    // Calculate what percentage of RDA per 100g serving
    return Math.round((food.nutrients[nutrientId] / rda) * 100);
  }

  function getNutrientLabel(pctRda) {
    if (pctRda >= 50) return 'excellent';
    if (pctRda >= 25) return 'good';
    if (pctRda >= 10) return 'moderate';
    return 'low';
  }

  // Get top foods for a specific nutrient (sorted by amount descending)
  function getTopFoodsForNutrient(nutrientId, limit) {
    limit = limit || 10;
    const foods = getAllFoods();
    return foods
      .filter(f => f.nutrients[nutrientId] > 0)
      .sort((a, b) => b.nutrients[nutrientId] - a.nutrients[nutrientId])
      .slice(0, limit);
  }

  // Get overall nutrition score for a food (average RDA coverage across key nutrients)
  function getOverallScore(food, ageGroup) {
    ageGroup = ageGroup || 'adults';
    const keyNutrients = ['protein', 'fiber', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'calcium', 'iron', 'potassium'];
    let total = 0;
    let count = 0;
    keyNutrients.forEach(nid => {
      const score = getNutrientScore(food, nid, ageGroup);
      total += Math.min(score, 100); // Cap at 100%
      count++;
    });
    return count > 0 ? Math.round(total / count) : 0;
  }

  return {
    init,
    getAllFoods, getFood, getFoodsByCategory, getFoodsByTag, getFoodsByGrocerySection, getFruitsByClass,
    getCategories, getCategory,
    getNutrients, getNutrient,
    getSupplements, getSupplement,
    getAgeGroups, getAgeGroup,
    getRecipes, getRecipe, getRecipesByTime, getRecipesByMeal, getRecipesForFood,
    getRestaurantGuide, getRestaurantByCategory,
    getShopping, getWeeklyPlans, getWeeklyPlan,
    getNutrientScore, getNutrientLabel, getTopFoodsForNutrient, getOverallScore
  };
})();
