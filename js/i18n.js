/**
 * i18n.js - Translation engine for EatWise
 * Loads language JSONs, applies translations, handles RTL
 */
const I18n = (() => {
  let _strings = {};
  let _lang = 'en';
  let _fallback = {};
  let _manifest = [];

  async function init() {
    _lang = localStorage.getItem('ew-lang') || 'en';
    const resp = await fetch('data/lang/index.json');
    _manifest = await resp.json();

    const enResp = await fetch('data/lang/en.json');
    _fallback = await enResp.json();

    if (_lang !== 'en') {
      try {
        const langResp = await fetch(`data/lang/${_lang}.json`);
        _strings = await langResp.json();
      } catch {
        _strings = {};
        _lang = 'en';
      }
    } else {
      _strings = _fallback;
    }

    _applyDir();
    _applyTranslations();
    _buildSwitcher();
  }

  function t(key) {
    return _strings[key] || _fallback[key] || key;
  }

  function getLang() {
    return _lang;
  }

  function getManifest() {
    return _manifest;
  }

  function getFoodName(food) {
    if (food.name[_lang]) return food.name[_lang];
    return food.name.en || food.id;
  }

  async function setLang(lang) {
    _lang = lang;
    localStorage.setItem('ew-lang', lang);

    if (lang !== 'en') {
      try {
        const resp = await fetch(`data/lang/${lang}.json`);
        _strings = await resp.json();
      } catch {
        _strings = {};
      }
    } else {
      _strings = _fallback;
    }

    _applyDir();
    _applyTranslations();
    _updateSwitcher();
    document.dispatchEvent(new CustomEvent('ew-lang-change', { detail: { lang: _lang } }));
  }

  function _applyDir() {
    if (_lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', _lang);
    }
  }

  function _applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text !== key) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
  }

  function _buildSwitcher() {
    const container = document.getElementById('lang-switcher');
    if (!container) return;
    const select = document.createElement('select');
    select.id = 'lang-select';
    select.className = 'lang-select';
    select.setAttribute('aria-label', 'Language');
    _manifest.forEach(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = t(`lang.${code}`);
      if (code === _lang) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', (e) => setLang(e.target.value));
    container.innerHTML = '';
    container.appendChild(select);
  }

  function _updateSwitcher() {
    const select = document.getElementById('lang-select');
    if (!select) return;
    select.value = _lang;
    Array.from(select.options).forEach(opt => {
      opt.textContent = t(`lang.${opt.value}`);
    });
  }

  return { init, t, getLang, getManifest, getFoodName, setLang };
})();
