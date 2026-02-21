/**
 * Test: All JSON data and language files parse correctly
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function run() {
  const results = [];

  function test(name, fn) {
    try { fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, error: e.message }); }
  }

  const dataFiles = [
    'data/foods.json', 'data/nutrients.json', 'data/categories.json',
    'data/age-groups.json', 'data/recipes.json', 'data/supplements.json',
    'data/restaurant-guide.json', 'data/shopping.json'
  ];

  for (const file of dataFiles) {
    test(`${file} is valid JSON`, () => {
      const raw = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      if (!raw.trim()) throw new Error('File is empty');
      JSON.parse(raw);
    });
  }

  test('data/lang/index.json is valid JSON', () => {
    const raw = fs.readFileSync(path.join(ROOT, 'data/lang/index.json'), 'utf-8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('Expected array');
    if (arr.length < 1) throw new Error('Empty language list');
  });

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lang/index.json'), 'utf-8'));
  for (const code of manifest) {
    test(`data/lang/${code}.json is valid JSON`, () => {
      const raw = fs.readFileSync(path.join(ROOT, `data/lang/${code}.json`), 'utf-8');
      if (!raw.trim()) throw new Error('File is empty');
      const obj = JSON.parse(raw);
      if (typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Expected object');
      if (Object.keys(obj).length < 10) throw new Error(`Only ${Object.keys(obj).length} keys`);
    });
  }

  return results;
}

module.exports = { run };
