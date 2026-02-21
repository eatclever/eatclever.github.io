/**
 * Test: Translation key completeness across all languages
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

  const manifest = load('data/lang/index.json');
  const en = load('data/lang/en.json');
  const enKeys = new Set(Object.keys(en));

  test('manifest lists 12 languages', () => {
    if (manifest.length !== 12) throw new Error(`Expected 12 languages, got ${manifest.length}: ${manifest.join(',')}`);
  });

  test('all manifest languages have .json files', () => {
    const missing = [];
    for (const code of manifest) {
      const p = path.join(ROOT, `data/lang/${code}.json`);
      if (!fs.existsSync(p)) missing.push(code);
    }
    if (missing.length > 0) throw new Error(`Missing files: ${missing.join(', ')}`);
  });

  // Check each non-English language
  for (const code of manifest) {
    if (code === 'en') continue;

    const lang = load(`data/lang/${code}.json`);
    const langKeys = new Set(Object.keys(lang));

    test(`${code}.json: has all en.json keys`, () => {
      const missing = [];
      for (const k of enKeys) {
        if (!langKeys.has(k)) missing.push(k);
      }
      if (missing.length > 0) {
        throw new Error(`Missing ${missing.length} keys: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
      }
    });

    test(`${code}.json: no orphan keys`, () => {
      const orphans = [];
      for (const k of langKeys) {
        if (!enKeys.has(k)) orphans.push(k);
      }
      if (orphans.length > 0) {
        throw new Error(`${orphans.length} orphan keys: ${orphans.slice(0, 5).join(', ')}${orphans.length > 5 ? '...' : ''}`);
      }
    });

    test(`${code}.json: no empty values`, () => {
      const empty = [];
      for (const [k, v] of Object.entries(lang)) {
        if (typeof v === 'string' && v.trim() === '') empty.push(k);
      }
      if (empty.length > 0) {
        throw new Error(`${empty.length} empty values: ${empty.slice(0, 5).join(', ')}${empty.length > 5 ? '...' : ''}`);
      }
    });
  }

  // Language switcher keys
  test('all lang.* keys exist for language switcher', () => {
    const missing = [];
    for (const code of manifest) {
      const key = `lang.${code}`;
      if (!enKeys.has(key)) missing.push(key);
    }
    if (missing.length > 0) throw new Error(`Missing lang keys: ${missing.join(', ')}`);
  });

  // Check data-i18n keys used in HTML exist in en.json
  test('all data-i18n keys in HTML exist in en.json', () => {
    const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
    const missing = new Set();
    const regex = /data-i18n="([^"]+)"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (!enKeys.has(match[1])) missing.add(match[1]);
      }
    }
    if (missing.size > 0) {
      throw new Error(`Missing ${missing.size} keys: ${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? '...' : ''}`);
    }
  });

  return results;
}

module.exports = { run };
