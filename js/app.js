/**
 * app.js - Main renderer for EatClever
 * Detects current page and renders appropriate content
 */
// Disable browser's scroll restoration (fires before dynamic content is ready)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Save scroll position before leaving the page
window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('ew-scroll-' + location.pathname, window.scrollY);
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Data.init();
    await I18n.init();
  } catch (e) {
    console.error('EatClever init failed:', e);
    return;
  }

  if (typeof FoodSelector !== 'undefined') FoodSelector.init();

  // Tooltip setup
  _setupTooltip();
  _setupScrollTop();

  const page = detectPage();
  renderPage(page);

  // Restore scroll position after content is rendered
  const savedY = sessionStorage.getItem('ew-scroll-' + location.pathname);
  if (savedY) {
    requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
  }

  // Re-render on language change
  document.addEventListener('ew-lang-change', () => renderPage(detectPage()));

  // Horizontal scroll arrows for .grid-5 containers
  document.querySelectorAll('.grid-5').forEach(grid => {
    const wrapper = document.createElement('div');
    wrapper.className = 'scroll-wrapper';
    grid.parentNode.insertBefore(wrapper, grid);
    wrapper.appendChild(grid);

    const leftBtn = document.createElement('button');
    leftBtn.className = 'scroll-arrow scroll-arrow-left';
    leftBtn.innerHTML = '&#9664;';
    leftBtn.setAttribute('aria-label', 'Scroll left');

    const rightBtn = document.createElement('button');
    rightBtn.className = 'scroll-arrow scroll-arrow-right';
    rightBtn.innerHTML = '&#9654;';
    rightBtn.setAttribute('aria-label', 'Scroll right');

    wrapper.appendChild(leftBtn);
    wrapper.appendChild(rightBtn);

    function updateArrows() {
      const canLeft = grid.scrollLeft > 5;
      const canRight = grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 5;
      leftBtn.classList.toggle('visible', canLeft);
      rightBtn.classList.toggle('visible', canRight);
    }

    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 200);

    leftBtn.addEventListener('click', () => {
      grid.scrollBy({ left: -220, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      grid.scrollBy({ left: 220, behavior: 'smooth' });
    });
  });
});

/* ===== Page detection ===== */
function detectPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('age-nutrition')) return 'age-nutrition';
  if (path.includes('food-vs-supplements')) return 'food-vs-supplements';
  if (path.includes('taste-nutrition')) return 'taste-nutrition';
  if (path.includes('eat-out-vs-home')) return 'eat-out-vs-home';
  if (path.includes('cook-time')) return 'cook-time';
  if (path.includes('shopping')) return 'shopping';
  if (path.includes('food-detail')) return 'food-detail';
  if (path.includes('compare')) return 'compare';
  if (path.includes('meal-planner')) return 'meal-planner';
  if (path.includes('quiz')) return 'quiz';
  return 'index';
}

/* ===== Render dispatch ===== */
function renderPage(page) {
  const renderers = {
    'index': renderIndex,
    'age-nutrition': renderAgeNutrition,
    'food-vs-supplements': renderSupplements,
    'taste-nutrition': renderTasteNutrition,
    'eat-out-vs-home': renderEatOut,
    'cook-time': renderCookTime,
    'shopping': renderShopping,
    'food-detail': renderFoodDetail,
    'compare': renderCompare,
    'meal-planner': renderMealPlanner,
    'quiz': renderQuiz
  };
  if (renderers[page]) renderers[page]();
}


/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

/* ===== Currency formatting by language ===== */
const _currencyMap = {
  en: { symbol: '$',  rate: 1,     before: true  },
  de: { symbol: '€',  rate: 0.92,  before: false },
  es: { symbol: '€',  rate: 0.92,  before: false },
  fr: { symbol: '€',  rate: 0.92,  before: false },
  it: { symbol: '€',  rate: 0.92,  before: false },
  pt: { symbol: 'R$', rate: 5.0,   before: true  },
  ro: { symbol: 'lei', rate: 4.6,  before: false },
  ru: { symbol: '₽',  rate: 92,    before: false },
  zh: { symbol: '¥',  rate: 7.2,   before: true  },
  ja: { symbol: '¥',  rate: 150,   before: true  },
  ar: { symbol: '$',  rate: 1,     before: true  },
  hi: { symbol: '₹',  rate: 83,    before: true  }
};

function formatPrice(usdAmount) {
  const lang = (typeof I18n !== 'undefined' && I18n.getLang()) || 'en';
  const c = _currencyMap[lang] || _currencyMap.en;
  const converted = Math.round(usdAmount * c.rate);
  if (c.before) return `${c.symbol}${converted}`;
  return `${converted}${c.symbol === 'lei' ? ' ' + c.symbol : c.symbol}`;
}

function scoreColor(pctRda) {
  if (pctRda >= 50) return '#2E7D32';
  if (pctRda >= 25) return '#66BB6A';
  if (pctRda >= 10) return '#FFA726';
  return '#E53935';
}

function scoreClass(pctRda) {
  if (pctRda >= 50) return 'score-excellent';
  if (pctRda >= 25) return 'score-good';
  if (pctRda >= 10) return 'score-moderate';
  return 'score-low';
}

function timeBadge(cat) {
  const colors = { quick: '#2E7D32', medium: '#E65100', long: '#6A1B9A' };
  return `<span class="time-badge" style="background:${colors[cat] || '#666'}">${I18n.t('time.' + cat)}</span>`;
}

function difficultyBadge(diff) {
  return `<span class="difficulty-badge difficulty-${diff}">${I18n.t('difficulty.' + diff)}</span>`;
}

function infoBtn(descKey) {
  return `<button class="info-btn" data-desc="${descKey}" type="button" aria-label="Info">i</button>`;
}

function _costBadge(tier) {
  const labels = { 1: 'food.cost_tier.1', 2: 'food.cost_tier.2', 3: 'food.cost_tier.3' };
  const colors = { 1: '#2E7D32', 2: '#E65100', 3: '#6A1B9A' };
  return `<span class="cost-badge" style="background:${colors[tier] || '#666'}">${I18n.t(labels[tier] || 'food.cost_tier.1')}</span>`;
}

function _categoryIcon(catId) {
  const icons = {
    protein: '\u{1F969}', grain: '\u{1F33E}', vegetable: '\u{1F966}',
    fruit: '\u{1F34E}', dairy: '\u{1F95B}', nut_seed: '\u{1F330}',
    legume: '\u{1FAD8}', other: '\u{1F375}'
  };
  return icons[catId] || '\u{1F37D}';
}

function _foodIcon(food) {
  return food.emoji || _categoryIcon(food.category);
}

function _formatList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' ' + I18n.t('general.and') + ' ' + items[items.length - 1];
}

function _backLink() {
  return `<a href="index.html" class="back-link">&larr; ${I18n.t('general.home')}</a>`;
}

function _nutrientBarHtml(nutrientId, food, ageGroup) {
  ageGroup = ageGroup || 'adults';
  const nutrient = Data.getNutrient(nutrientId);
  if (!nutrient) return '';
  const val = food.nutrients[nutrientId] || 0;
  const rda = nutrient.rda[ageGroup] || nutrient.rda.adults;
  const pct = rda > 0 ? Math.round((val / rda) * 100) : 0;
  const capped = Math.min(pct, 100);
  const color = scoreColor(pct);
  return `<div class="nutrient-bar-row">
    <span class="nutrient-bar-label">${I18n.t(nutrient.name_key)}</span>
    <div class="nutrient-bar-track">
      <div class="nutrient-bar-fill ${scoreClass(pct)}" style="width:${capped}%;background:${color}"></div>
    </div>
    <span class="nutrient-bar-value">${val}${nutrient.unit} <small>(${pct}%)</small></span>
  </div>`;
}

function _recipeCardHtml(recipe) {
  const recipeName = I18n.t(recipe.name_key);
  const recipeDesc = I18n.t(recipe.desc_key);
  const tn = recipe.total_nutrients || {};
  return `<div class="card recipe-card" data-recipe-id="${recipe.id}">
    <div class="card-header">
      <h3 class="card-title">${recipeName}</h3>
      <div class="card-badges">
        ${timeBadge(recipe.cook_time_cat)}
        ${difficultyBadge(recipe.difficulty)}
        ${_costBadge(recipe.cost_tier)}
      </div>
    </div>
    <div class="card-body">
      <p class="card-desc">${recipeDesc}</p>
      <div class="recipe-quick-stats">
        <span class="stat-pill">${tn.calories || 0} kcal</span>
        <span class="stat-pill">${I18n.t('general.protein')}: ${tn.protein || 0}g</span>
        <span class="stat-pill">${I18n.t('general.fiber')}: ${tn.fiber || 0}g</span>
        <span class="stat-pill">${recipe.cook_time_min} ${I18n.t('general.minutes')}</span>
      </div>
      ${recipe.tags ? `<div class="card-tags">${recipe.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    </div>
    <button class="card-expand-btn" type="button" aria-label="Show details">${I18n.t('general.show_more')}</button>
    <div class="card-expanded" style="display:none">
      <h4>${I18n.t('general.ingredients')}</h4>
      <ul class="ingredients-list">
        ${(recipe.ingredients || []).map(ing => {
          const food = Data.getFood(ing.food_id);
          const name = food ? I18n.getFoodName(food) : ing.food_id;
          return `<li><a href="food-detail.html?id=${ing.food_id}">${name}</a> - ${ing.amount_g}g</li>`;
        }).join('')}
      </ul>
      <h4>${I18n.t('general.steps')}</h4>
      <div class="recipe-steps">${I18n.t(recipe.steps_key).split('\n').map(s => `<p>${s}</p>`).join('')}</div>
    </div>
  </div>`;
}

function _bindRecipeExpand(container) {
  if (!container) return;
  container.querySelectorAll('.card-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.nextElementSibling;
      if (!expanded) return;
      const visible = expanded.style.display !== 'none';
      expanded.style.display = visible ? 'none' : 'block';
      btn.textContent = visible ? I18n.t('general.show_more') : I18n.t('general.show_less');
    });
  });
}


/* ===== Share bar ===== */
function _shareBarHtml(id) {
  return `<div class="share-bar" id="${id}">
    <span class="share-bar-label" data-i18n="general.share">${I18n.t('general.share')}</span>
    <div class="share-bar-buttons">
      <button class="share-btn share-whatsapp" data-platform="whatsapp" aria-label="WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </button>
      <button class="share-btn share-x" data-platform="x" aria-label="X/Twitter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button class="share-btn share-facebook" data-platform="facebook" aria-label="Facebook">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </button>
      <button class="share-btn share-linkedin" data-platform="linkedin" aria-label="LinkedIn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </button>
      <button class="share-btn share-telegram" data-platform="telegram" aria-label="Telegram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </button>
      <button class="share-btn share-copy" data-platform="copy" aria-label="Copy link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      </button>
    </div>
  </div>`;
}

function _bindShareButtons(container, shareText, shareUrl) {
  if (!container) return;
  container.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const text = encodeURIComponent(shareText);
      const url = encodeURIComponent(shareUrl);
      let shareLink = '';
      switch (platform) {
        case 'whatsapp': shareLink = `https://wa.me/?text=${text}%20${url}`; break;
        case 'x': shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
        case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'linkedin': shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`; break;
        case 'telegram': shareLink = `https://t.me/share/url?url=${url}&text=${text}`; break;
        case 'copy':
          navigator.clipboard.writeText(decodeURIComponent(url)).then(() => {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 2000);
          });
          return;
      }
      if (shareLink) window.open(shareLink, '_blank', 'width=600,height=400');
    });
  });
}


/* ===== Tooltip setup ===== */
function _setupTooltip() {
  const _tooltip = document.createElement('div');
  _tooltip.id = 'ew-tooltip';
  document.body.appendChild(_tooltip);

  function _showTooltip(btn) {
    const text = btn.dataset.desc ? I18n.t(btn.dataset.desc) : '';
    if (!text || text === btn.dataset.desc) return;
    _tooltip.textContent = text;
    _tooltip.classList.add('visible');
    const rect = btn.getBoundingClientRect();
    const tipH = _tooltip.offsetHeight;
    const tipW = _tooltip.offsetWidth;
    let top = rect.top - tipH - 8;
    let left = rect.left + rect.width / 2 - tipW / 2;
    if (top < 8) top = rect.bottom + 8;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    _tooltip.style.top = top + 'px';
    _tooltip.style.left = left + 'px';
  }

  function _hideTooltip() {
    _tooltip.classList.remove('visible');
    document.querySelectorAll('.info-btn.active').forEach(b => b.classList.remove('active'));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.classList.contains('active')) { _hideTooltip(); }
      else { _hideTooltip(); btn.classList.add('active'); _showTooltip(btn); }
      return;
    }
    _hideTooltip();
  });

  document.addEventListener('mouseenter', (e) => {
    if (e.target.classList && e.target.classList.contains('info-btn')) {
      _hideTooltip(); e.target.classList.add('active'); _showTooltip(e.target);
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (e.target.classList && e.target.classList.contains('info-btn')) { _hideTooltip(); }
  }, true);

  window.addEventListener('scroll', () => { _hideTooltip(); }, { passive: true });
}


/* ===== Scroll-to-top ===== */
function _setupScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.innerHTML = '&#9650;';
  btn.title = 'Scroll to top';
  btn.style.background = '#2E7D32';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ==========================================================================
   renderIndex - Homepage
   ========================================================================== */
function renderIndex() {
  _renderBodyWisdom();
  _renderCategoryCards();
  _renderFeaturedCards();
  _renderVitaminsGrid();
  _renderLabelsGuide();
  _renderHomeShareBar();
}

function _renderBodyWisdom() {
  const container = document.getElementById('body-wisdom-box');
  if (!container) return;
  container.innerHTML = `
    <div class="summary-box--editorial">
      <p>${I18n.t('wisdom.p1')}</p>
      <p>${I18n.t('wisdom.p2')}</p>
      <p>${I18n.t('wisdom.p3')}</p>
      <p class="summary-cta">${I18n.t('wisdom.cta')}</p>
    </div>`;
}

function _renderCategoryCards() {
  const container = document.getElementById('category-cards');
  if (!container) return;
  const categories = Data.getCategories();
  container.innerHTML = categories.map(cat => `
    <a href="${cat.page}" class="card category-card" style="border-left:4px solid ${cat.color}">
      <span class="card-icon">${cat.icon}</span>
      <div class="card-content">
        <h3 class="card-title">${I18n.t(cat.name_key)}</h3>
        <p class="card-desc">${I18n.t(cat.desc_key)}</p>
        <span class="card-link" style="color:${cat.color}">${I18n.t('general.learn_more')} &rarr;</span>
      </div>
    </a>
  `).join('');
}

function _renderFeaturedCards() {
  const container = document.getElementById('featured-cards');
  if (!container) return;

  const featured = [
    { title: 'Top Foods', icon: '\u{1F3C6}', color: '#2E7D32', link: 'food-detail.html?top=10' },
    { title: 'Quick Meals Under 15 Min', icon: '\u{23F1}', color: '#E65100', link: 'cook-time.html' },
    { title: 'Supplement Swaps', icon: '\u{1F48A}', color: '#C62828', link: 'food-vs-supplements.html' },
    { title: 'Kids\' Favorites', icon: '\u{1F476}', color: '#1565C0', link: 'age-nutrition.html' },
    { title: 'Budget Eating', icon: '\u{1F4B0}', color: '#6A1B9A', link: 'shopping.html' }
  ];

  container.innerHTML = featured.map(f => `
    <a href="${f.link}" class="card featured-card" style="border-top:3px solid ${f.color}">
      <span class="featured-icon">${f.icon}</span>
      <h3 class="featured-title">${f.title}</h3>
    </a>
  `).join('');
}

function _renderVitaminsGrid() {
  const container = document.getElementById('vitamins-grid');
  if (!container) return;
  const nutrients = Data.getNutrients();
  const nutrientIds = Object.keys(nutrients);

  container.innerHTML = nutrientIds.map(nid => {
    const n = nutrients[nid];
    const topFoods = Data.getTopFoodsForNutrient(nid, 3);
    const foodNames = topFoods.map(f => I18n.getFoodName(f));
    return `<div class="card nutrient-guide-card">
      <div class="nutrient-header">
        <span class="nutrient-dot" style="background:${n.color}"></span>
        <h3 class="card-title">${I18n.t(n.name_key)}</h3>
        ${infoBtn(n.desc_key)}
      </div>
      <p class="nutrient-body-effect">${I18n.t(n.body_effect_key)}</p>
      <div class="nutrient-sources">
        <strong>${I18n.t('vitamins.top_foods')}:</strong> ${foodNames.length > 0 ? foodNames.join(', ') : '-'}
      </div>
      <div class="nutrient-rda">
        <small>${I18n.t('vitamins.rda')}: ${n.rda.adults}${n.unit} (${I18n.t('age.adults')})</small>
      </div>
    </div>`;
  }).join('');
}

function _renderLabelsGuide() {
  const container = document.getElementById('labels-guide');
  if (!container) return;

  const labelItems = [
    'labels.what_is_protein',
    'labels.what_is_fat',
    'labels.what_is_saturated_fat',
    'labels.what_is_carbs',
    'labels.what_is_sugar',
    'labels.what_is_fiber',
    'labels.what_is_salt',
    'labels.what_is_calories'
  ];

  container.innerHTML = `
    <div class="summary-box">
      <h3>${I18n.t('labels.how_to_read')}</h3>
      <ol class="labels-steps">
        <li>${I18n.t('labels.step_1')}</li>
        <li>${I18n.t('labels.step_2')}</li>
        <li>${I18n.t('labels.step_3')}</li>
        <li>${I18n.t('labels.step_4')}</li>
        <li>${I18n.t('labels.step_5')}</li>
      </ol>

      <h3>${I18n.t('labels.section.subtitle')}</h3>
      <div class="label-items">
        ${labelItems.map(key => `<p class="label-item">${I18n.t(key)}</p>`).join('')}
      </div>

      <h3>${I18n.t('labels.traffic_light')}</h3>
      <div class="traffic-light-guide">
        <div class="traffic-row">
          <span class="traffic-dot" style="background:#2E7D32"></span>
          <span>${I18n.t('labels.green_low')}</span>
        </div>
        <div class="traffic-row">
          <span class="traffic-dot" style="background:#FFA726"></span>
          <span>${I18n.t('labels.amber_medium')}</span>
        </div>
        <div class="traffic-row">
          <span class="traffic-dot" style="background:#E53935"></span>
          <span>${I18n.t('labels.red_high')}</span>
        </div>
      </div>

      <h3>${I18n.t('labels.common_traps')}</h3>
      <ul class="labels-traps">
        <li>${I18n.t('labels.trap_serving_size')}</li>
        <li>${I18n.t('labels.trap_sugar_names')}</li>
        <li>${I18n.t('labels.trap_health_claims')}</li>
        <li>${I18n.t('labels.trap_zero')}</li>
      </ul>

      <p class="label-tip"><strong>${I18n.t('labels.tip')}</strong></p>
    </div>`;
}

function _renderHomeShareBar() {
  const container = document.getElementById('share-bar-home');
  if (!container) return;
  container.innerHTML = _shareBarHtml('share-bar-home-inner');
  _bindShareButtons(
    document.getElementById('share-bar-home-inner'),
    I18n.t('site.title') + ' - ' + I18n.t('hero.subtitle'),
    window.location.href
  );
}


/* ==========================================================================
   renderAgeNutrition - Nutrition by Age
   ========================================================================== */
function renderAgeNutrition() {
  const container = document.getElementById('age-nutrition-content');
  if (!container) return;
  const ageGroups = Data.getAgeGroups();
  if (!ageGroups.length) { container.innerHTML = '<p>No age group data available.</p>'; return; }

  const activeGroup = ageGroups[0].id;

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('age.section.title')}</h1>
    <p class="page-subtitle">${I18n.t('age.section.subtitle')}</p>

    <div class="pillar-tabs" id="age-tabs">
      ${ageGroups.map((g, i) => `
        <button class="pillar-tab ${i === 0 ? 'active' : ''}" data-age="${g.id}" style="--tab-color:${g.color}">
          <span class="tab-icon">${g.icon}</span>
          ${I18n.t(g.name_key)}
        </button>
      `).join('')}
    </div>

    <div id="age-group-detail"></div>

    <div class="summary-box" id="age-chart-section">
      <h3>${I18n.t('age.section.title')} - ${I18n.t('age.key_nutrients')}</h3>
      <canvas id="age-nutrient-chart" width="600" height="300"></canvas>
    </div>
  `;

  _renderAgeGroupDetail(activeGroup);
  _bindAgeTabs();
  _renderAgeNutrientChart();
}

function _renderAgeGroupDetail(groupId) {
  const detail = document.getElementById('age-group-detail');
  if (!detail) return;
  const group = Data.getAgeGroup(groupId);
  if (!group) return;

  const subs = group.sub_groups || [];

  detail.innerHTML = subs.map(sub => {
    const focusNutrients = sub.focus_nutrients || [];
    const keyFoods = sub.key_foods || [];
    const avoidItems = sub.avoid || [];

    return `<div class="card age-sub-card">
      <h3>${I18n.t(sub.name_key)} (${sub.range} ${I18n.t('general.of')} age)</h3>

      <div class="age-calorie-range">
        <strong>${I18n.t('age.calorie_range')}:</strong>
        <span class="calorie-range-badge">${sub.daily_calories.min} - ${sub.daily_calories.max} kcal</span>
      </div>

      <div class="age-focus-nutrients">
        <h4>${I18n.t('age.focus_nutrients')}</h4>
        ${focusNutrients.map(nid => {
          const nutrient = Data.getNutrient(nid);
          if (!nutrient) return '';
          const rdaVal = nutrient.rda[groupId] || nutrient.rda.adults;
          return `<div class="nutrient-bar-row">
            <span class="nutrient-bar-label" style="color:${nutrient.color}">${I18n.t(nutrient.name_key)}</span>
            <div class="nutrient-bar-track">
              <div class="nutrient-bar-fill" style="width:100%;background:${nutrient.color};opacity:0.7"></div>
            </div>
            <span class="nutrient-bar-value">${I18n.t('vitamins.rda')}: ${rdaVal}${nutrient.unit}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="age-key-foods">
        <h4>${I18n.t('age.recommended_foods')}</h4>
        <div class="food-chips">
          ${keyFoods.map(fid => {
            const food = Data.getFood(fid);
            if (!food) return `<span class="food-chip">${fid}</span>`;
            return `<a href="food-detail.html?id=${fid}" class="food-chip">${_foodIcon(food)} ${I18n.getFoodName(food)}</a>`;
          }).join('')}
        </div>
      </div>

      <div class="age-avoid">
        <h4>${I18n.t('age.foods_to_limit')}</h4>
        <ul class="avoid-list">
          ${avoidItems.map(item => `<li>${item.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
      </div>

      <div class="age-tips summary-box">
        <h4>${I18n.t('age.tips_title')}</h4>
        <p>${I18n.t(sub.tips_key)}</p>
      </div>
    </div>`;
  }).join('');

  // Supplement summary for seniors
  if (groupId === 'seniors') {
    detail.innerHTML += `<div class="summary-box supplement-note">
      <h4>${I18n.t('vitamins.supplement_note')}</h4>
      <p>${I18n.t('supp.vitamin_b12.note')}</p>
      <p>${I18n.t('supp.vitamin_d.note')}</p>
      <p>${I18n.t('supp.calcium.note')}</p>
    </div>`;
  }
}

function _bindAgeTabs() {
  const tabs = document.querySelectorAll('#age-tabs .pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderAgeGroupDetail(tab.dataset.age);
    });
  });
}

function _renderAgeNutrientChart() {
  const canvas = document.getElementById('age-nutrient-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ageGroups = Data.getAgeGroups();
  const keyNutrients = ['calcium', 'iron', 'vitamin_d', 'protein', 'fiber'];
  const labels = ageGroups.map(g => I18n.t(g.name_key));

  const datasets = keyNutrients.map(nid => {
    const nutrient = Data.getNutrient(nid);
    if (!nutrient) return null;
    const data = ageGroups.map(g => nutrient.rda[g.id] || nutrient.rda.adults);
    return {
      label: I18n.t(nutrient.name_key) + ' (' + nutrient.unit + ')',
      data: data,
      backgroundColor: nutrient.color + '88',
      borderColor: nutrient.color,
      borderWidth: 2
    };
  }).filter(Boolean);

  new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}


/* ==========================================================================
   renderSupplements - Food vs. Supplements
   ========================================================================== */
function renderSupplements() {
  const container = document.getElementById('supplements-content');
  if (!container) return;
  const supplements = Data.getSupplements();

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('supp.section.title')}</h1>
    <p class="page-subtitle">${I18n.t('supp.section.subtitle')}</p>
    <div class="summary-box food-first-box">
      <p><strong>${I18n.t('vitamins.food_first')}</strong></p>
      <p>${I18n.t('supp.food_first_message')}</p>
    </div>

    <div class="cards-grid grid-3x2">
      ${supplements.map(supp => {
        const nutrient = supp.nutrient_id ? Data.getNutrient(supp.nutrient_id) : null;
        const nutrientColor = nutrient ? nutrient.color : '#666';
        return `<div class="card supplement-card" style="border-left:4px solid ${nutrientColor}">
          <h3 class="card-title">${I18n.t(supp.supplement_name_key)}</h3>
          <div class="supp-dose">
            <strong>${I18n.t('supp.common_dose')}:</strong> ${supp.common_dose}
          </div>
          <div class="supp-why">
            <p>${I18n.t(supp.why_key)}</p>
          </div>
          <div class="supp-alternatives">
            <h4>${I18n.t('supp.food_alternative')}</h4>
            ${(supp.food_alternatives || []).map(alt => {
              const food = Data.getFood(alt.food_id);
              const foodName = food ? I18n.getFoodName(food) : alt.food_id;
              const pct = alt.pct_rda;
              const barWidth = pct !== null ? Math.min(pct, 100) : 0;
              const barColor = pct !== null ? scoreColor(pct) : '#999';
              return `<div class="supp-alt-row">
                <a href="food-detail.html?id=${alt.food_id}" class="supp-food-name">${foodName}</a>
                <span class="supp-serving">${alt.serving}</span>
                ${pct !== null ? `
                  <div class="nutrient-bar-track">
                    <div class="nutrient-bar-fill" style="width:${barWidth}%;background:${barColor}"></div>
                  </div>
                  <span class="supp-pct">${pct}% ${I18n.t('supp.of_daily_need')}</span>
                ` : `<span class="supp-pct">${I18n.t('supp.per_serving')}</span>`}
              </div>`;
            }).join('')}
          </div>
          <div class="supp-note summary-box">
            <strong>${I18n.t('supp.verdict')}:</strong> ${I18n.t(supp.note_key)}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}


/* ==========================================================================
   renderTasteNutrition - Taste & Nutrition
   ========================================================================== */
function renderTasteNutrition() {
  const container = document.getElementById('taste-nutrition-content');
  if (!container) return;

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const activeMeal = 'breakfast';

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('taste.section.title')}</h1>
    <p class="page-subtitle">${I18n.t('taste.section.subtitle')}</p>

    <div class="pillar-tabs" id="meal-tabs">
      ${mealTypes.map((mt, i) => `
        <button class="pillar-tab ${i === 0 ? 'active' : ''}" data-meal="${mt}">
          ${I18n.t('meal.' + mt)}
        </button>
      `).join('')}
    </div>

    <div id="taste-recipe-grid" class="cards-grid grid-3x2"></div>
  `;

  _renderMealRecipes(activeMeal);
  _bindMealTabs();
}

function _renderMealRecipes(mealType) {
  const grid = document.getElementById('taste-recipe-grid');
  if (!grid) return;
  const recipes = Data.getRecipesByMeal(mealType);
  if (!recipes.length) {
    grid.innerHTML = `<p class="no-results">${I18n.t('general.no_results')}</p>`;
    return;
  }
  grid.innerHTML = recipes.map(r => _recipeCardHtml(r)).join('');
  _bindRecipeExpand(grid);
}

function _bindMealTabs() {
  const tabs = document.querySelectorAll('#meal-tabs .pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderMealRecipes(tab.dataset.meal);
    });
  });
}


/* ==========================================================================
   renderEatOut - Eating Out vs. Home
   ========================================================================== */
function renderEatOut() {
  const container = document.getElementById('eat-out-content');
  if (!container) return;

  const allItems = Data.getRestaurantGuide();
  const categories = ['all', 'fast_food', 'pizza', 'asian', 'mexican', 'italian', 'cafe', 'deli'];
  const activeCat = 'all';

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('cat.eat_out_vs_home')}</h1>
    <p class="page-subtitle">${I18n.t('cat.eat_out_vs_home.desc')}</p>

    <div class="pillar-tabs" id="resto-tabs">
      ${categories.map((cat, i) => `
        <button class="pillar-tab ${i === 0 ? 'active' : ''}" data-restocat="${cat}">
          ${cat === 'all' ? I18n.t('cook.filter.all') : I18n.t('resto.category.' + cat)}
        </button>
      `).join('')}
    </div>

    <div id="resto-grid"></div>
  `;

  _renderRestoCards(activeCat);
  _bindRestoTabs();
}

function _renderRestoCards(category) {
  const grid = document.getElementById('resto-grid');
  if (!grid) return;
  let items = Data.getRestaurantGuide();
  if (category !== 'all') {
    items = items.filter(r => r.category === category);
  }

  grid.innerHTML = items.map(item => {
    const rest = item.restaurant_option;
    const home = item.home_option;
    const savings = item.savings_pct || {};
    const metrics = ['calories', 'fat', 'sodium', 'sugar'];
    const savingsLabels = {
      calories: 'resto.fewer_calories',
      fat: 'resto.less_fat',
      sodium: 'resto.less_sodium',
      cost: 'resto.cost_savings'
    };

    return `<div class="card resto-compare-card">
      <h3 class="card-title">${I18n.t(item.restaurant_name_key)}</h3>
      <div class="resto-panels">
        <div class="resto-panel resto-panel-out">
          <h4 class="panel-label" style="color:#E53935">${I18n.t('resto.restaurant_version')}</h4>
          <p class="panel-desc">${I18n.t(rest.name_key)}</p>
          <div class="panel-stats">
            <div class="stat-row"><span>${I18n.t('general.calories')}</span><span class="stat-val-bad">${rest.calories}</span></div>
            <div class="stat-row"><span>${I18n.t('general.protein')}</span><span>${rest.protein}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.fat')}</span><span class="stat-val-bad">${rest.fat}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.sodium')}</span><span class="stat-val-bad">${rest.sodium}mg</span></div>
            <div class="stat-row"><span>${I18n.t('general.sugar')}</span><span class="stat-val-bad">${rest.sugar}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.cost')}</span><span>${formatPrice(rest.cost_usd)}</span></div>
          </div>
        </div>
        <div class="resto-panel resto-panel-home">
          <h4 class="panel-label" style="color:#2E7D32">${I18n.t('resto.home_version')}</h4>
          <p class="panel-desc">${I18n.t(home.name_key)}</p>
          <div class="panel-stats">
            <div class="stat-row"><span>${I18n.t('general.calories')}</span><span class="stat-val-good">${home.calories}</span></div>
            <div class="stat-row"><span>${I18n.t('general.protein')}</span><span>${home.protein}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.fat')}</span><span class="stat-val-good">${home.fat}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.sodium')}</span><span class="stat-val-good">${home.sodium}mg</span></div>
            <div class="stat-row"><span>${I18n.t('general.sugar')}</span><span class="stat-val-good">${home.sugar}g</span></div>
            <div class="stat-row"><span>${I18n.t('general.cost')}</span><span>${formatPrice(home.cost_usd)}</span></div>
          </div>
          <div class="cook-time-note">${I18n.t('resto.cook_time')}: ${home.cook_time_min} ${I18n.t('general.minutes')}</div>
        </div>
      </div>

      <div class="savings-section">
        <h4>${I18n.t('resto.savings_label')}</h4>
        <div class="savings-bars">
          ${Object.keys(savings).map(key => `
            <div class="savings-bar-row">
              <span class="savings-label">${I18n.t(savingsLabels[key] || key)}</span>
              <div class="savings-bar-track">
                <div class="savings-bar-fill" style="width:${savings[key]}%;background:#2E7D32"></div>
              </div>
              <span class="savings-pct">${savings[key]}%</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="resto-tip summary-box">
        <p>${I18n.t(item.tip_key)}</p>
      </div>
    </div>`;
  }).join('');
}

function _bindRestoTabs() {
  const tabs = document.querySelectorAll('#resto-tabs .pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderRestoCards(tab.dataset.restocat);
    });
  });
}


/* ==========================================================================
   renderCookTime - Cook Time & Nutrition
   ========================================================================== */
function renderCookTime() {
  const container = document.getElementById('cook-time-content');
  if (!container) return;

  const recipes = Data.getRecipes();
  const quickCount = recipes.filter(r => r.cook_time_cat === 'quick').length;
  const medCount = recipes.filter(r => r.cook_time_cat === 'medium').length;
  const longCount = recipes.filter(r => r.cook_time_cat === 'long').length;

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('cook.section.title')}</h1>
    <p class="page-subtitle">${I18n.t('cook.section.subtitle')}</p>

    <div class="pillar-tabs" id="cook-tabs">
      <button class="pillar-tab active" data-cooktime="quick" style="--tab-color:#2E7D32">
        ${I18n.t('cook.filter.quick')} <span class="tab-count">(${quickCount})</span>
      </button>
      <button class="pillar-tab" data-cooktime="medium" style="--tab-color:#E65100">
        ${I18n.t('cook.filter.medium')} <span class="tab-count">(${medCount})</span>
      </button>
      <button class="pillar-tab" data-cooktime="long" style="--tab-color:#6A1B9A">
        ${I18n.t('cook.filter.long')} <span class="tab-count">(${longCount})</span>
      </button>
    </div>

    <div id="cook-recipe-grid" class="cards-grid grid-3x2"></div>
  `;

  _renderCookRecipes('quick');
  _bindCookTabs();
}

function _renderCookRecipes(timeCat) {
  const grid = document.getElementById('cook-recipe-grid');
  if (!grid) return;
  const recipes = Data.getRecipesByTime(timeCat);
  if (!recipes.length) {
    grid.innerHTML = `<p class="no-results">${I18n.t('general.no_results')}</p>`;
    return;
  }
  grid.innerHTML = recipes.map(r => _recipeCardHtml(r)).join('');
  _bindRecipeExpand(grid);
}

function _bindCookTabs() {
  const tabs = document.querySelectorAll('#cook-tabs .pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderCookRecipes(tab.dataset.cooktime);
    });
  });
}


/* ==========================================================================
   renderShopping - Smart Shopping
   ========================================================================== */
function renderShopping() {
  const container = document.getElementById('shopping-content');
  if (!container) return;

  const plans = Data.getWeeklyPlans();
  const shopping = Data.getShopping();
  const budgetLabels = { 1: 'general.budget', 2: 'general.moderate', 3: 'general.premium' };
  const budgetColors = { 1: '#2E7D32', 2: '#E65100', 3: '#6A1B9A' };

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('shop.section.title')}</h1>
    <p class="page-subtitle">${I18n.t('shop.section.subtitle')}</p>

    <div class="pillar-tabs" id="budget-tabs">
      ${plans.map((plan, i) => `
        <button class="pillar-tab ${i === 0 ? 'active' : ''}" data-plan="${plan.id}" style="--tab-color:${budgetColors[plan.budget_tier] || '#666'}">
          ${I18n.t(plan.name_key)}
        </button>
      `).join('')}
    </div>

    <div id="shopping-plan-detail"></div>

    <div class="summary-box" id="shopping-tips-section">
      <h3>${I18n.t('shop.tips_title')}</h3>
      <ul class="shopping-tips-list">
        ${(shopping.tips_keys || []).map(key => `<li>${I18n.t(key)}</li>`).join('')}
      </ul>
    </div>
  `;

  if (plans.length) _renderShoppingPlan(plans[0].id);
  _bindBudgetTabs();
}

function _renderShoppingPlan(planId) {
  const detail = document.getElementById('shopping-plan-detail');
  if (!detail) return;
  const plan = Data.getWeeklyPlan(planId);
  if (!plan) return;

  const perDay = formatPrice(plan.total_cost_usd / 7);

  // 7-day meal grid
  const daysHtml = (plan.days || []).map(day => {
    const meals = day.meals || {};
    return `<div class="meal-day-card">
      <h4>${I18n.t('shop.day_label')} ${day.day}</h4>
      <div class="meal-slots">
        ${['breakfast', 'lunch', 'dinner', 'snack'].map(slot => {
          const recipeId = meals[slot];
          const recipe = recipeId ? Data.getRecipe(recipeId) : null;
          const name = recipe ? I18n.t(recipe.name_key) : (recipeId || '-');
          return `<div class="meal-slot">
            <span class="meal-slot-label">${I18n.t('meal.' + slot)}</span>
            <span class="meal-slot-name">${name}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  // Shopping list grouped by grocery section
  const grouped = {};
  (plan.shopping_list || []).forEach(item => {
    const section = item.grocery_section || 'other';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item);
  });

  const listHtml = Object.keys(grouped).map(section => {
    const sectionLabel = I18n.t('shop.section.' + section);
    const items = grouped[section];
    const sectionTotal = items.reduce((sum, it) => sum + (it.est_cost_usd || 0), 0).toFixed(2);
    return `<div class="shopping-section-group">
      <h4 class="shopping-section-title">${sectionLabel} <small>(${formatPrice(parseFloat(sectionTotal))})</small></h4>
      <table class="shopping-table">
        <thead>
          <tr>
            <th>${I18n.t('shop.item')}</th>
            <th>${I18n.t('shop.quantity')}</th>
            <th>${I18n.t('shop.est_price')}</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const food = Data.getFood(item.food_id);
            const name = food ? I18n.getFoodName(food) : item.food_id;
            return `<tr>
              <td><a href="food-detail.html?id=${item.food_id}">${name}</a></td>
              <td>${item.quantity}</td>
              <td>${formatPrice(item.est_cost_usd)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }).join('');

  detail.innerHTML = `
    <div class="shopping-cost-summary">
      <div class="cost-box">
        <span class="cost-label">${I18n.t('shop.weekly_cost')}</span>
        <span class="cost-value">${formatPrice(plan.total_cost_usd)}</span>
      </div>
      <div class="cost-box">
        <span class="cost-label">${I18n.t('shop.per_day')}</span>
        <span class="cost-value">${perDay}</span>
      </div>
    </div>

    <h3>${I18n.t('shop.view_meal_plan')}</h3>
    <div class="meal-days-grid">
      ${daysHtml}
    </div>

    <h3>${I18n.t('shop.view_shopping_list')}</h3>
    <div class="shopping-list-sections">
      ${listHtml}
    </div>

    <div class="shopping-total">
      <strong>${I18n.t('shop.total')}: ${formatPrice(plan.total_cost_usd)}</strong>
    </div>
  `;
}

function _bindBudgetTabs() {
  const tabs = document.querySelectorAll('#budget-tabs .pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _renderShoppingPlan(tab.dataset.plan);
    });
  });
}


/* ==========================================================================
   renderFoodDetail - Individual Food Page
   ========================================================================== */
function renderFoodDetail() {
  const container = document.getElementById('food-detail-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const foodId = params.get('id');
  if (!foodId) {
    const topN = parseInt(params.get('top'));
    const allFoods = Data.getAllFoods();

    if (topN > 0) {
      // Three-section top foods page
      const _topByCategory = (cat, n) => allFoods
        .filter(f => f.category === cat)
        .map(f => ({ food: f, score: Data.getOverallScore(f, 'adults') }))
        .sort((a, b) => b.score - a.score)
        .slice(0, n)
        .map(item => item.food);

      const _topOverall = (excludeCats, n) => allFoods
        .filter(f => !excludeCats.includes(f.category))
        .map(f => ({ food: f, score: Data.getOverallScore(f, 'adults') }))
        .sort((a, b) => b.score - a.score)
        .slice(0, n)
        .map(item => item.food);

      const topVeg = _topByCategory('vegetable', topN);
      const topFruit = _topByCategory('fruit', topN);
      const topSuper = _topOverall(['vegetable', 'fruit'], topN);

      const _renderSection = (title, icon, foods) => `
        <div class="top-foods-section">
          <h2>${icon} ${title}</h2>
          <div class="food-browse-grid">
            ${foods.map((f, i) => `
              <a href="food-detail.html?id=${f.id}" class="card food-browse-card">
                <span class="food-browse-rank">#${i + 1}</span>
                <span class="food-browse-icon">${_foodIcon(f)}</span>
                <span class="food-browse-name">${I18n.getFoodName(f)}</span>
                <span class="food-browse-cal">${f.calories} kcal</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = `
        ${_backLink()}
        <h1 class="page-title">\u{1F3C6} Top Foods</h1>
        ${_renderSection(I18n.t('food.category.vegetable'), '\u{1F966}', topVeg)}
        ${_renderSection(I18n.t('food.category.fruit'), '\u{1F352}', topFruit)}
        ${_renderSection('Superfoods', '\u{2B50}', topSuper)}
      `;
      return;
    }

    // No top param: show all foods alphabetically
    const foods = allFoods.slice().sort((a, b) => I18n.getFoodName(a).localeCompare(I18n.getFoodName(b)));
    container.innerHTML = `
      ${_backLink()}
      <h1 class="page-title">${I18n.t('nav.food_search')}</h1>
      <div class="food-browse-grid">
        ${foods.map(f => `
          <a href="food-detail.html?id=${f.id}" class="card food-browse-card">
            <span class="food-browse-icon">${_foodIcon(f)}</span>
            <span class="food-browse-name">${I18n.getFoodName(f)}</span>
            <span class="food-browse-cal">${f.calories} kcal</span>
          </a>
        `).join('')}
      </div>
    `;
    return;
  }

  const food = Data.getFood(foodId);
  if (!food) {
    container.innerHTML = `${_backLink()}<p>${I18n.t('general.no_results')}</p>`;
    return;
  }

  const foodName = I18n.getFoodName(food);
  const nutrients = Data.getNutrients();
  const nutrientIds = Object.keys(nutrients);
  const recipes = Data.getRecipesForFood(foodId);
  const supplements = Data.getSupplements().filter(s => {
    return (s.food_alternatives || []).some(alt => alt.food_id === foodId);
  });
  const ageGroups = Data.getAgeGroups();

  // Find age groups that benefit most from this food's key nutrients
  const benefitAges = [];
  ageGroups.forEach(ag => {
    (ag.sub_groups || []).forEach(sub => {
      const keyFoods = sub.key_foods || [];
      if (keyFoods.includes(foodId)) {
        benefitAges.push(I18n.t(sub.name_key));
      }
    });
  });

  container.innerHTML = `
    ${_backLink()}

    <div class="food-detail-header">
      <h1 class="page-title">${_foodIcon(food)} ${foodName}</h1>
      <div class="food-tags-row">
        <span class="tag category-tag" style="background:${_catColor(food.category)}">${I18n.t('food.category.' + food.category)}</span>
        ${food.subcategory ? `<span class="tag subcategory-tag">${food.subcategory}</span>` : ''}
        ${food.fruit_class ? `<span class="tag fruit-class-tag">${I18n.t('food.fruit_class.' + food.fruit_class)}</span>` : ''}
        ${_costBadge(food.cost_tier)}
      </div>
    </div>

    <div class="food-calorie-display">
      <span class="calorie-big">${food.calories}</span>
      <span class="calorie-unit">kcal ${I18n.t('general.per_100g')}</span>
    </div>

    <div class="food-nutrients-section">
      <h2>${I18n.t('food.detail.nutrients')}</h2>
      <div class="nutrient-bars-list">
        ${nutrientIds.map(nid => _nutrientBarHtml(nid, food)).join('')}
      </div>
    </div>

    ${food.grocery_section ? `
      <div class="food-section-info">
        <h3>${I18n.t('food.detail.available_at')}</h3>
        <p>${I18n.t('food.section.' + food.grocery_section)}</p>
      </div>
    ` : ''}

    ${food.availability ? `
      <div class="food-availability">
        <p>${I18n.t('food.availability.' + food.availability)}</p>
      </div>
    ` : ''}

    ${recipes.length > 0 ? `
      <div class="food-recipes-section">
        <h3>${I18n.t('food.detail.recipes')}</h3>
        <div class="food-recipe-links">
          ${recipes.map(r => `<a href="taste-nutrition.html" class="recipe-link-chip">${I18n.t(r.name_key)}</a>`).join('')}
        </div>
      </div>
    ` : ''}

    ${benefitAges.length > 0 ? `
      <div class="food-age-benefits">
        <h3>${I18n.t('food.detail.age_benefits')}</h3>
        <div class="age-benefit-chips">
          ${benefitAges.map(a => `<span class="age-chip">${a}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    ${supplements.length > 0 ? `
      <div class="food-supplement-section">
        <h3>${I18n.t('food.detail.replaces_supplement')}</h3>
        <div class="supplement-links">
          ${supplements.map(s => `
            <a href="food-vs-supplements.html" class="supplement-link-chip">${I18n.t(s.supplement_name_key)}</a>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${food.tags && food.tags.length > 0 ? `
      <div class="food-tags-section">
        <h3>${I18n.t('general.tags')}</h3>
        <div class="card-tags">${food.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    ` : ''}

    ${_shareBarHtml('share-bar-food')}
  `;

  _bindShareButtons(
    document.getElementById('share-bar-food'),
    `${foodName} - ${I18n.t('site.title')}`,
    window.location.href
  );
}

function _catColor(catId) {
  const colors = {
    protein: '#E53935', grain: '#FDD835', vegetable: '#2E7D32',
    fruit: '#FF7043', dairy: '#42A5F5', nut_seed: '#8D6E63',
    legume: '#66BB6A', other: '#78909C'
  };
  return colors[catId] || '#999';
}


/* ==========================================================================
   renderCompare - Compare Foods
   ========================================================================== */
function renderCompare() {
  const container = document.getElementById('compare-content');
  if (!container) return;

  const allFoods = Data.getAllFoods().slice().sort((a, b) =>
    I18n.getFoodName(a).localeCompare(I18n.getFoodName(b), I18n.getLang())
  );
  const foodOptions = allFoods.map(f => `<option value="${f.id}">${I18n.getFoodName(f)} (${f.calories} kcal)</option>`).join('');

  container.innerHTML = `
    ${_backLink()}
    <h1 class="page-title">${I18n.t('compare.title')}</h1>
    <p class="page-subtitle">${I18n.t('compare.subtitle')}</p>

    <div class="compare-controls">
      <div class="compare-selector">
        <label>${I18n.t('compare.select_hint')} 1</label>
        <select id="compare-food-1" class="food-select">
          <option value="">-- ${I18n.t('compare.select_hint')} --</option>
          ${foodOptions}
        </select>
      </div>
      <div class="compare-selector">
        <label>${I18n.t('compare.select_hint')} 2</label>
        <select id="compare-food-2" class="food-select">
          <option value="">-- ${I18n.t('compare.select_hint')} --</option>
          ${foodOptions}
        </select>
      </div>
      <div class="compare-selector">
        <label>${I18n.t('compare.select_hint')} 3 (${I18n.t('general.or')})</label>
        <select id="compare-food-3" class="food-select">
          <option value="">-- ${I18n.t('general.no')} --</option>
          ${foodOptions}
        </select>
      </div>
    </div>

    <div class="compare-toggle">
      <label>
        <input type="radio" name="compare-mode" value="per100g" checked> ${I18n.t('compare.per_100g')}
      </label>
      <label>
        <input type="radio" name="compare-mode" value="perserving"> ${I18n.t('compare.per_serving')}
      </label>
    </div>

    <button class="btn btn-primary" id="compare-btn" type="button">${I18n.t('compare.title')}</button>

    <div id="compare-results" style="display:none">
      <div class="compare-chart-container">
        <canvas id="compare-radar-chart" width="400" height="400"></canvas>
      </div>
      <div id="compare-nutrient-bars"></div>
      <div id="compare-summary"></div>
    </div>
  `;

  document.getElementById('compare-btn').addEventListener('click', _runComparison);
}

let _compareChart = null;

function _runComparison() {
  const id1 = document.getElementById('compare-food-1').value;
  const id2 = document.getElementById('compare-food-2').value;
  const id3 = document.getElementById('compare-food-3').value;
  if (!id1 || !id2) return;

  const foods = [Data.getFood(id1), Data.getFood(id2)];
  if (id3) { const f3 = Data.getFood(id3); if (f3) foods.push(f3); }
  if (foods.some(f => !f)) return;

  const results = document.getElementById('compare-results');
  results.style.display = 'block';

  const nutrients = Data.getNutrients();
  const nutrientIds = Object.keys(nutrients);
  const chartColors = ['#2E7D32', '#E65100', '#1565C0'];

  // Radar chart
  const radarCanvas = document.getElementById('compare-radar-chart');
  if (radarCanvas && typeof Chart !== 'undefined') {
    if (_compareChart) _compareChart.destroy();

    const keyNutrients = ['protein', 'fiber', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'calcium', 'iron', 'omega_3'];
    const labels = keyNutrients.map(nid => I18n.t(nutrients[nid].name_key));

    const datasets = foods.map((food, idx) => {
      const data = keyNutrients.map(nid => Data.getNutrientScore(food, nid));
      return {
        label: I18n.getFoodName(food),
        data,
        borderColor: chartColors[idx],
        backgroundColor: chartColors[idx] + '33',
        pointBackgroundColor: chartColors[idx],
        borderWidth: 2
      };
    });

    _compareChart = new Chart(radarCanvas, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 25 }
          }
        },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Side-by-side nutrient bars
  const barsContainer = document.getElementById('compare-nutrient-bars');
  if (barsContainer) {
    barsContainer.innerHTML = `<h3>${I18n.t('food.detail.nutrients')}</h3>` +
      nutrientIds.map(nid => {
        const n = nutrients[nid];
        const scores = foods.map(f => Data.getNutrientScore(f, nid));
        const maxScore = Math.max(...scores, 1);
        return `<div class="compare-bar-group">
          <span class="compare-nutrient-label">${I18n.t(n.name_key)} (${n.unit})</span>
          <div class="compare-bar-rows">
            ${foods.map((f, idx) => {
              const val = f.nutrients[nid] || 0;
              const pct = scores[idx];
              const width = Math.min((pct / Math.max(maxScore, 100)) * 100, 100);
              return `<div class="compare-bar-item">
                <span class="compare-food-label" style="color:${chartColors[idx]}">${I18n.getFoodName(f)}</span>
                <div class="nutrient-bar-track">
                  <div class="nutrient-bar-fill" style="width:${width}%;background:${chartColors[idx]}"></div>
                </div>
                <span class="nutrient-bar-value">${val}${n.unit} (${pct}%)</span>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('');
  }

  // Summary: which food wins each nutrient
  const summaryContainer = document.getElementById('compare-summary');
  if (summaryContainer) {
    const wins = foods.map(() => 0);
    const winDetails = [];
    nutrientIds.forEach(nid => {
      const n = nutrients[nid];
      const scores = foods.map(f => Data.getNutrientScore(f, nid));
      let bestIdx = 0;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[bestIdx]) bestIdx = i;
      }
      if (scores[bestIdx] > 0) {
        wins[bestIdx]++;
        winDetails.push({
          nutrient: I18n.t(n.name_key),
          winner: I18n.getFoodName(foods[bestIdx]),
          winnerIdx: bestIdx
        });
      }
    });

    summaryContainer.innerHTML = `
      <h3>${I18n.t('compare.winner')}</h3>
      <div class="compare-score-summary">
        ${foods.map((f, i) => `
          <div class="compare-score-card" style="border-top:3px solid ${chartColors[i]}">
            <span class="compare-food-name">${I18n.getFoodName(f)}</span>
            <span class="compare-win-count">${wins[i]} / ${nutrientIds.length}</span>
          </div>
        `).join('')}
      </div>
      <div class="compare-detail-list">
        ${winDetails.map(d => `
          <div class="compare-detail-row">
            <span>${d.nutrient}</span>
            <span style="color:${chartColors[d.winnerIdx]};font-weight:600">${d.winner}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}


/* ==========================================================================
   renderMealPlanner - Daily Meal Planner
   ========================================================================== */
function renderMealPlanner() {
  const container = document.getElementById('meal-planner-content');
  if (!container) return;

  const ageGroups = Data.getAgeGroups();
  const recipes = Data.getRecipes();
  const recipeOptions = recipes.map(r => `<option value="${r.id}">${I18n.t(r.name_key)} (${(r.total_nutrients || {}).calories || 0} kcal)</option>`).join('');

  const stored = _loadPlannerState();
  const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'];

  container.innerHTML = `
    <h1 class="page-title">${I18n.t('planner.title')}</h1>
    <p class="page-subtitle">${I18n.t('planner.subtitle')}</p>

    <div class="planner-controls">
      <label>${I18n.t('planner.select_age')}</label>
      <select id="planner-age-select" class="food-select">
        ${ageGroups.map(g => `<option value="${g.id}" ${stored.ageGroup === g.id ? 'selected' : ''}>${I18n.t(g.name_key)}</option>`).join('')}
      </select>
    </div>

    <div class="planner-slots" id="planner-slots">
      ${mealSlots.map(slot => `
        <div class="planner-slot-card" data-slot="${slot}">
          <h3>${I18n.t('planner.' + slot)}</h3>
          <div class="planner-slot-meal" id="planner-meal-${slot}">
            ${stored.meals[slot] ? _plannerMealDisplay(stored.meals[slot]) : `<span class="planner-empty">${I18n.t('planner.add_meal')}</span>`}
          </div>
          <div class="planner-add-row">
            <select class="food-select planner-recipe-select" data-slot="${slot}">
              <option value="">-- ${I18n.t('planner.add_meal')} --</option>
              ${recipeOptions}
            </select>
            <button class="btn btn-small planner-add-btn" data-slot="${slot}" type="button">+</button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="planner-totals-section" id="planner-totals">
      <h3>${I18n.t('planner.daily_total')}</h3>
      <div id="planner-calorie-total" class="planner-calorie-bar"></div>
      <div id="planner-nutrient-bars"></div>
    </div>

    <button class="btn btn-secondary" id="planner-clear-btn" type="button">${I18n.t('planner.clear_all')}</button>
  `;

  _updatePlannerTotals();
  _bindPlannerEvents();
}

function _plannerMealDisplay(recipeId) {
  const recipe = Data.getRecipe(recipeId);
  if (!recipe) return '';
  const tn = recipe.total_nutrients || {};
  return `<div class="planner-meal-item" data-recipe-id="${recipeId}">
    <span class="planner-meal-name">${I18n.t(recipe.name_key)}</span>
    <span class="planner-meal-cal">${tn.calories || 0} kcal</span>
    <button class="planner-remove-btn" type="button" aria-label="${I18n.t('planner.remove_meal')}">&times;</button>
  </div>`;
}

function _loadPlannerState() {
  try {
    const raw = localStorage.getItem('ew-planner');
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { ageGroup: 'adults', meals: {} };
}

function _savePlannerState(state) {
  localStorage.setItem('ew-planner', JSON.stringify(state));
}

function _bindPlannerEvents() {
  // Add buttons
  document.querySelectorAll('.planner-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      const select = document.querySelector(`.planner-recipe-select[data-slot="${slot}"]`);
      const recipeId = select ? select.value : '';
      if (!recipeId) return;

      const state = _loadPlannerState();
      state.meals[slot] = recipeId;
      _savePlannerState(state);

      const display = document.getElementById('planner-meal-' + slot);
      if (display) {
        display.innerHTML = _plannerMealDisplay(recipeId);
        _bindRemoveButtons();
      }
      _updatePlannerTotals();
    });
  });

  // Remove buttons
  _bindRemoveButtons();

  // Clear all
  const clearBtn = document.getElementById('planner-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const state = _loadPlannerState();
      state.meals = {};
      _savePlannerState(state);
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(slot => {
        const display = document.getElementById('planner-meal-' + slot);
        if (display) display.innerHTML = `<span class="planner-empty">${I18n.t('planner.add_meal')}</span>`;
      });
      _updatePlannerTotals();
    });
  }

  // Age group change
  const ageSelect = document.getElementById('planner-age-select');
  if (ageSelect) {
    ageSelect.addEventListener('change', () => {
      const state = _loadPlannerState();
      state.ageGroup = ageSelect.value;
      _savePlannerState(state);
      _updatePlannerTotals();
    });
  }
}

function _bindRemoveButtons() {
  document.querySelectorAll('.planner-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mealItem = btn.closest('.planner-meal-item');
      const slotCard = btn.closest('.planner-slot-card');
      if (!mealItem || !slotCard) return;
      const slot = slotCard.dataset.slot;

      const state = _loadPlannerState();
      delete state.meals[slot];
      _savePlannerState(state);

      const display = document.getElementById('planner-meal-' + slot);
      if (display) display.innerHTML = `<span class="planner-empty">${I18n.t('planner.add_meal')}</span>`;
      _updatePlannerTotals();
    });
  });
}

function _updatePlannerTotals() {
  const state = _loadPlannerState();
  const ageGroup = state.ageGroup || 'adults';
  const nutrients = Data.getNutrients();
  const nutrientIds = Object.keys(nutrients);
  const totals = {};
  let totalCal = 0;

  nutrientIds.forEach(nid => { totals[nid] = 0; });

  Object.values(state.meals).forEach(recipeId => {
    const recipe = Data.getRecipe(recipeId);
    if (!recipe) return;
    const tn = recipe.total_nutrients || {};
    totalCal += tn.calories || 0;

    // Estimate nutrient totals from ingredients
    (recipe.ingredients || []).forEach(ing => {
      const food = Data.getFood(ing.food_id);
      if (!food) return;
      const factor = (ing.amount_g || 100) / 100;
      nutrientIds.forEach(nid => {
        totals[nid] += (food.nutrients[nid] || 0) * factor;
      });
    });
  });

  // Calorie display
  const calContainer = document.getElementById('planner-calorie-total');
  if (calContainer) {
    const ageGroupData = Data.getAgeGroup(ageGroup);
    let calTarget = 2000;
    if (ageGroupData && ageGroupData.sub_groups && ageGroupData.sub_groups.length > 0) {
      const sub = ageGroupData.sub_groups[ageGroupData.sub_groups.length - 1];
      calTarget = sub.daily_calories ? Math.round((sub.daily_calories.min + sub.daily_calories.max) / 2) : 2000;
    }
    const calPct = Math.round((totalCal / calTarget) * 100);
    calContainer.innerHTML = `
      <div class="planner-cal-row">
        <span>${I18n.t('general.calories')}: <strong>${totalCal}</strong> / ${calTarget} kcal</span>
        <span>(${calPct}%)</span>
      </div>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${Math.min(calPct, 100)}%;background:${calPct > 110 ? '#E53935' : '#2E7D32'}"></div>
      </div>
    `;
  }

  // Nutrient bars
  const barsContainer = document.getElementById('planner-nutrient-bars');
  if (barsContainer) {
    barsContainer.innerHTML = nutrientIds.map(nid => {
      const n = nutrients[nid];
      const rda = n.rda[ageGroup] || n.rda.adults;
      const val = Math.round(totals[nid] * 10) / 10;
      const pct = rda > 0 ? Math.round((val / rda) * 100) : 0;
      const capped = Math.min(pct, 100);
      const color = scoreColor(pct);
      return `<div class="nutrient-bar-row">
        <span class="nutrient-bar-label">${I18n.t(n.name_key)}</span>
        <div class="nutrient-bar-track">
          <div class="nutrient-bar-fill" style="width:${capped}%;background:${color}"></div>
        </div>
        <span class="nutrient-bar-value">${val}${n.unit} <small>(${pct}% ${I18n.t('planner.rda_coverage')})</small></span>
      </div>`;
    }).join('');
  }
}


/* ==========================================================================
   renderQuiz - Nutrition Quiz
   ========================================================================== */
let _quizState = null;
let _quizDifficulty = 'medium';

function renderQuiz() {
  const container = document.getElementById('quiz-content');
  if (!container) return;

  _quizState = {
    questions: [],
    current: 0,
    score: 0,
    answered: false,
    total: 10
  };

  container.innerHTML = `
    <div class="quiz-start-screen" id="quiz-start">
      <div class="quiz-icon">\u{1F9E0}</div>
      <h1 class="page-title">${I18n.t('quiz.title')}</h1>
      <p class="page-subtitle">${I18n.t('quiz.subtitle')}</p>
      <div class="quiz-difficulty">
        <p style="font-weight:600;margin-bottom:0.5rem;">${I18n.t('quiz.difficulty') || 'Choose difficulty'}</p>
        <div class="quiz-diff-buttons">
          <button class="quiz-diff-btn${_quizDifficulty === 'easy' ? ' active' : ''}" data-diff="easy">\u{1F331} ${I18n.t('quiz.easy') || 'Easy'}</button>
          <button class="quiz-diff-btn${_quizDifficulty === 'medium' ? ' active' : ''}" data-diff="medium">\u{1F33F} ${I18n.t('quiz.medium') || 'Medium'}</button>
          <button class="quiz-diff-btn${_quizDifficulty === 'hard' ? ' active' : ''}" data-diff="hard">\u{1F332} ${I18n.t('quiz.hard') || 'Hard'}</button>
        </div>
      </div>
      <button class="btn btn-primary" id="quiz-start-btn" type="button">${I18n.t('quiz.start')}</button>
    </div>
    <div class="quiz-play-screen" id="quiz-play" style="display:none">
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" id="quiz-progress-fill"></div>
      </div>
      <div class="quiz-header">
        <span id="quiz-question-num"></span>
        <span id="quiz-score-display"></span>
      </div>
      <div id="quiz-question-area"></div>
      <div id="quiz-feedback-area" style="display:none"></div>
      <button class="btn btn-primary" id="quiz-next-btn" type="button" style="display:none">${I18n.t('quiz.next')}</button>
    </div>
    <div class="quiz-results-screen" id="quiz-results" style="display:none">
      <h2 id="quiz-final-score"></h2>
      <p id="quiz-rating"></p>
      <div id="quiz-results-share"></div>
      <button class="btn btn-primary" id="quiz-again-btn" type="button">${I18n.t('quiz.play_again')}</button>
    </div>
  `;

  document.getElementById('quiz-start-btn').addEventListener('click', _startQuiz);
  document.getElementById('quiz-next-btn').addEventListener('click', _nextQuestion);
  document.getElementById('quiz-again-btn').addEventListener('click', () => renderQuiz());

  container.querySelectorAll('.quiz-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _quizDifficulty = btn.dataset.diff;
      container.querySelectorAll('.quiz-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function _generateQuizQuestions() {
  const questions = [];
  const foods = Data.getAllFoods();
  const nutrients = Data.getNutrients();
  const nutrientIds = Object.keys(nutrients);
  const ageGroups = Data.getAgeGroups();

  // Helper to pick random items
  function pick(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // === EASY questions: basic category/comparison questions ===

  // Type 1: "Which is lower in calories?" (easy - straightforward comparison)
  for (let i = 0; i < 3; i++) {
    const twoFoods = pick(foods, 2);
    if (twoFoods.length < 2) continue;
    const [a, b] = twoFoods;
    const winner = a.calories <= b.calories ? a : b;
    const loser = a.calories <= b.calories ? b : a;
    questions.push({
      diff: 'easy',
      text: `Which is lower in calories per 100g: ${I18n.getFoodName(a)} or ${I18n.getFoodName(b)}?`,
      options: [I18n.getFoodName(a), I18n.getFoodName(b)],
      correct: a.calories <= b.calories ? 0 : 1,
      explanation: `${I18n.getFoodName(winner)} has ${Math.min(a.calories, b.calories)} kcal/100g vs ${Math.max(a.calories, b.calories)} kcal/100g for ${I18n.getFoodName(loser)}.`
    });
  }

  // "Which food has more protein?" (easy - common nutrient)
  for (let i = 0; i < 3; i++) {
    const nid = randItem(['protein', 'fiber', 'vitamin_c']);
    const n = nutrients[nid];
    if (!n) continue;
    const twoFoods = pick(foods.filter(f => f.nutrients[nid] > 0), 2);
    if (twoFoods.length < 2) continue;
    const [a, b] = twoFoods;
    const aVal = a.nutrients[nid];
    const bVal = b.nutrients[nid];
    const winner = aVal >= bVal ? a : b;
    const loser = aVal >= bVal ? b : a;
    questions.push({
      diff: 'easy',
      text: `Which food has more ${I18n.t(n.name_key)} per 100g: ${I18n.getFoodName(a)} or ${I18n.getFoodName(b)}?`,
      options: [I18n.getFoodName(a), I18n.getFoodName(b)],
      correct: aVal >= bVal ? 0 : 1,
      explanation: `${I18n.getFoodName(winner)} has ${Math.max(aVal, bVal)}${n.unit} per 100g compared to ${Math.min(aVal, bVal)}${n.unit} for ${I18n.getFoodName(loser)}.`
    });
  }

  // === MEDIUM questions: mix of nutrient comparisons and RDA questions ===

  // Type 1: "Which food has more [nutrient]?" (medium - any nutrient)
  for (let i = 0; i < 4; i++) {
    const nid = randItem(nutrientIds);
    const n = nutrients[nid];
    const twoFoods = pick(foods.filter(f => f.nutrients[nid] > 0), 2);
    if (twoFoods.length < 2) continue;
    const [a, b] = twoFoods;
    const aVal = a.nutrients[nid];
    const bVal = b.nutrients[nid];
    const winner = aVal >= bVal ? a : b;
    const loser = aVal >= bVal ? b : a;
    questions.push({
      diff: 'medium',
      text: `Which food has more ${I18n.t(n.name_key)} per 100g: ${I18n.getFoodName(a)} or ${I18n.getFoodName(b)}?`,
      options: [I18n.getFoodName(a), I18n.getFoodName(b)],
      correct: aVal >= bVal ? 0 : 1,
      explanation: `${I18n.getFoodName(winner)} has ${Math.max(aVal, bVal)}${n.unit} per 100g compared to ${Math.min(aVal, bVal)}${n.unit} for ${I18n.getFoodName(loser)}.`
    });
  }

  // "At what age do you need the most [nutrient]?" (medium)
  for (let i = 0; i < 2; i++) {
    const nid = randItem(['calcium', 'iron', 'vitamin_d', 'protein']);
    const n = nutrients[nid];
    if (!n) continue;
    const ageKeys = ['children', 'teens', 'adults', 'seniors'];
    const rdaVals = ageKeys.map(ak => ({ age: ak, rda: n.rda[ak] || 0 }));
    rdaVals.sort((a, b) => b.rda - a.rda);
    const correctAge = rdaVals[0].age;
    const correctLabel = I18n.t('age.' + correctAge);
    const opts = ageKeys.map(ak => I18n.t('age.' + ak));
    questions.push({
      diff: 'medium',
      text: `At which age do you need the most ${I18n.t(n.name_key)}?`,
      options: opts,
      correct: ageKeys.indexOf(correctAge),
      explanation: `${correctLabel} need the most ${I18n.t(n.name_key)} at ${rdaVals[0].rda}${n.unit} per day.`
    });
  }

  // === HARD questions: RDA specifics, tricky comparisons, detailed nutrition ===

  // "What's the recommended daily [nutrient] for [age group]?" (hard - specific numbers)
  for (let i = 0; i < 3; i++) {
    const nid = randItem(['calcium', 'iron', 'vitamin_d', 'protein', 'vitamin_c']);
    const n = nutrients[nid];
    if (!n) continue;
    const ageKey = randItem(['children', 'teens', 'adults', 'seniors']);
    const rda = n.rda[ageKey];
    if (!rda) continue;
    const ageLabel = I18n.t('age.' + ageKey);
    const wrong1 = Math.round(rda * 0.5);
    const wrong2 = Math.round(rda * 1.8);
    const wrong3 = Math.round(rda * 2.5);
    const opts = [rda, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
    questions.push({
      diff: 'hard',
      text: `What is the recommended daily ${I18n.t(n.name_key)} for ${ageLabel}?`,
      options: opts.map(v => `${v}${n.unit}`),
      correct: opts.indexOf(rda),
      explanation: `The recommended daily ${I18n.t(n.name_key)} intake for ${ageLabel} is ${rda}${n.unit}.`
    });
  }

  // Tricky nutrient comparisons (hard - less common nutrients)
  for (let i = 0; i < 3; i++) {
    const nid = randItem(nutrientIds.filter(id => !['protein', 'fiber', 'vitamin_c'].includes(id)));
    const n = nutrients[nid];
    if (!n) continue;
    const twoFoods = pick(foods.filter(f => f.nutrients[nid] > 0), 2);
    if (twoFoods.length < 2) continue;
    const [a, b] = twoFoods;
    const aVal = a.nutrients[nid];
    const bVal = b.nutrients[nid];
    const winner = aVal >= bVal ? a : b;
    const loser = aVal >= bVal ? b : a;
    questions.push({
      diff: 'hard',
      text: `Which food has more ${I18n.t(n.name_key)} per 100g: ${I18n.getFoodName(a)} or ${I18n.getFoodName(b)}?`,
      options: [I18n.getFoodName(a), I18n.getFoodName(b)],
      correct: aVal >= bVal ? 0 : 1,
      explanation: `${I18n.getFoodName(winner)} has ${Math.max(aVal, bVal)}${n.unit} per 100g compared to ${Math.min(aVal, bVal)}${n.unit} for ${I18n.getFoodName(loser)}.`
    });
  }

  // Filter by difficulty
  let filtered;
  if (_quizDifficulty === 'easy') {
    filtered = questions.filter(q => q.diff === 'easy');
  } else if (_quizDifficulty === 'hard') {
    filtered = questions.filter(q => q.diff === 'hard');
  } else {
    filtered = questions; // medium = mix of all
  }

  // If not enough questions, fill from all
  if (filtered.length < 10) {
    const extra = questions.filter(q => !filtered.includes(q));
    const shuffledExtra = [...extra].sort(() => Math.random() - 0.5);
    filtered = filtered.concat(shuffledExtra);
  }

  // Shuffle and take 10
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}

function _startQuiz() {
  _quizState.questions = _generateQuizQuestions();
  _quizState.current = 0;
  _quizState.score = 0;
  _quizState.total = _quizState.questions.length;

  document.getElementById('quiz-start').style.display = 'none';
  document.getElementById('quiz-play').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';

  _showQuestion();
}

function _showQuestion() {
  const q = _quizState.questions[_quizState.current];
  if (!q) { _showResults(); return; }

  _quizState.answered = false;

  const progressPct = Math.round((_quizState.current / _quizState.total) * 100);
  document.getElementById('quiz-progress-fill').style.width = progressPct + '%';
  document.getElementById('quiz-question-num').textContent =
    I18n.t('quiz.question_of').replace('{current}', _quizState.current + 1).replace('{total}', _quizState.total);
  document.getElementById('quiz-score-display').textContent =
    `${I18n.t('quiz.score')}: ${_quizState.score}`;

  document.getElementById('quiz-feedback-area').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';

  const area = document.getElementById('quiz-question-area');
  area.innerHTML = `
    <h2 class="quiz-question-text">${q.text}</h2>
    <div class="quiz-options">
      ${q.options.map((opt, idx) => `
        <button class="quiz-option-btn" data-idx="${idx}" type="button">${opt}</button>
      `).join('')}
    </div>
  `;

  area.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => _answerQuestion(parseInt(btn.dataset.idx)));
  });
}

function _answerQuestion(idx) {
  if (_quizState.answered) return;
  _quizState.answered = true;

  const q = _quizState.questions[_quizState.current];
  const correct = idx === q.correct;
  if (correct) _quizState.score++;

  // Highlight answers
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(btn => {
    const btnIdx = parseInt(btn.dataset.idx);
    if (btnIdx === q.correct) btn.classList.add('quiz-correct');
    else if (btnIdx === idx && !correct) btn.classList.add('quiz-wrong');
    btn.disabled = true;
  });

  const feedback = document.getElementById('quiz-feedback-area');
  feedback.style.display = 'block';
  feedback.innerHTML = `
    <div class="quiz-feedback ${correct ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}">
      <strong>${correct ? I18n.t('quiz.correct') : I18n.t('quiz.incorrect')}</strong>
      <p>${q.explanation}</p>
    </div>
  `;

  document.getElementById('quiz-score-display').textContent =
    `${I18n.t('quiz.score')}: ${_quizState.score}`;

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = (_quizState.current + 1 >= _quizState.total)
    ? I18n.t('quiz.results')
    : I18n.t('quiz.next');
}

function _nextQuestion() {
  _quizState.current++;
  if (_quizState.current >= _quizState.total) {
    _showResults();
  } else {
    _showQuestion();
  }
}

function _showResults() {
  document.getElementById('quiz-play').style.display = 'none';
  document.getElementById('quiz-results').style.display = 'block';

  const pct = Math.round((_quizState.score / _quizState.total) * 100);
  let rating = '';
  let emoji = '';
  if (pct >= 80) { rating = I18n.t('quiz.rating.expert'); emoji = '\u{1F3C6}'; }
  else if (pct >= 60) { rating = I18n.t('quiz.rating.great'); emoji = '\u{1F44D}'; }
  else if (pct >= 40) { rating = I18n.t('quiz.rating.good'); emoji = '\u{1F4AA}'; }
  else { rating = I18n.t('quiz.rating.learning'); emoji = '\u{1F331}'; }

  document.getElementById('quiz-final-score').textContent =
    `${emoji} ${_quizState.score} / ${_quizState.total} (${pct}%)`;
  document.getElementById('quiz-rating').textContent = rating;

  const shareContainer = document.getElementById('quiz-results-share');
  if (shareContainer) {
    shareContainer.innerHTML = `<h3>${I18n.t('quiz.share_score')}</h3>` + _shareBarHtml('quiz-share-bar');
    _bindShareButtons(
      document.getElementById('quiz-share-bar'),
      `I scored ${_quizState.score}/${_quizState.total} on the EatClever Nutrition Quiz!`,
      window.location.href
    );
  }
}


/* ==========================================================================
   DISCLAIMER FOOTER
   ========================================================================== */
(function _addDisclaimer() {
  const existing = document.querySelector('.site-disclaimer');
  if (existing) return;
  const footer = document.querySelector('footer') || document.querySelector('.footer');
  if (!footer) return;
  const disc = document.createElement('p');
  disc.className = 'site-disclaimer';
  disc.setAttribute('data-i18n', 'general.disclaimer');
  disc.textContent = 'This information is for educational purposes only and is not intended as medical or dietary advice. Consult a healthcare professional before making significant changes to your diet.';
  footer.appendChild(disc);
})();
