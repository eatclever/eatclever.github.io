/**
 * Test: Internal link integrity across HTML files
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

  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

  // Check href links to .html files
  test('all href="*.html" links point to existing files', () => {
    const broken = [];
    const hrefRegex = /href="([^"#]+\.html)(?:\?[^"]*)?"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const target = match[1];
        if (target.startsWith('http')) continue;
        if (!fs.existsSync(path.join(ROOT, target))) {
          broken.push(`${file}: ${target}`);
        }
      }
    }
    if (broken.length > 0) throw new Error(`Broken links:\n    ${broken.join('\n    ')}`);
  });

  // Check src="js/*.js" references
  test('all src="js/*.js" scripts exist', () => {
    const broken = [];
    const srcRegex = /src="(js\/[^"]+\.js)"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = srcRegex.exec(html)) !== null) {
        if (!fs.existsSync(path.join(ROOT, match[1]))) {
          broken.push(`${file}: ${match[1]}`);
        }
      }
    }
    if (broken.length > 0) throw new Error(`Missing scripts:\n    ${broken.join('\n    ')}`);
  });

  // Check href="css/*.css" references
  test('all href="css/*.css" stylesheets exist', () => {
    const broken = [];
    const cssRegex = /href="(css\/[^"]+\.css)"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = cssRegex.exec(html)) !== null) {
        if (!fs.existsSync(path.join(ROOT, match[1]))) {
          broken.push(`${file}: ${match[1]}`);
        }
      }
    }
    if (broken.length > 0) throw new Error(`Missing stylesheets:\n    ${broken.join('\n    ')}`);
  });

  // Check img src references
  test('all src="img/*" images exist', () => {
    const broken = [];
    const imgRegex = /src="(img\/[^"]+)"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        if (!fs.existsSync(path.join(ROOT, match[1]))) {
          broken.push(`${file}: ${match[1]}`);
        }
      }
    }
    if (broken.length > 0) throw new Error(`Missing images:\n    ${broken.join('\n    ')}`);
  });

  // Check OG image meta tags
  test('all og:image meta tags point to existing files', () => {
    const broken = [];
    const ogRegex = /content="(img\/[^"]+)"/g;
    for (const file of htmlFiles) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      let match;
      while ((match = ogRegex.exec(html)) !== null) {
        if (!fs.existsSync(path.join(ROOT, match[1]))) {
          broken.push(`${file}: ${match[1]}`);
        }
      }
    }
    if (broken.length > 0) throw new Error(`Missing OG images:\n    ${broken.join('\n    ')}`);
  });

  // Check that all HTML pages referenced in navigation exist
  test('all pages linked in footer exist', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    const footerLinks = new Set();
    const regex = /href="([a-z-]+\.html)"/g;
    let match;
    while ((match = regex.exec(indexHtml)) !== null) {
      footerLinks.add(match[1]);
    }
    const missing = [];
    for (const link of footerLinks) {
      if (!fs.existsSync(path.join(ROOT, link))) missing.push(link);
    }
    if (missing.length > 0) throw new Error(`Missing pages: ${missing.join(', ')}`);
  });

  return results;
}

module.exports = { run };
