#!/usr/bin/env node
/**
 * EatClever Test Runner
 * Discovers and runs all test-*.js files, prints summary.
 * Usage: node tests/run-tests.js
 */
const fs = require('fs');
const path = require('path');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.js'))
  .sort();

let totalPass = 0;
let totalFail = 0;
const failures = [];

console.log(`\n  EatClever Test Suite\n  ${'='.repeat(40)}\n`);

for (const file of testFiles) {
  const mod = require(path.join(testsDir, file));
  const suiteName = file.replace('test-', '').replace('.js', '');
  const results = mod.run();

  let suitePass = 0;
  let suiteFail = 0;

  for (const r of results) {
    if (r.ok) {
      suitePass++;
    } else {
      suiteFail++;
      failures.push({ suite: suiteName, test: r.name, error: r.error });
    }
  }

  const icon = suiteFail === 0 ? '\x1b[32m\u2713\x1b[0m' : '\x1b[31m\u2717\x1b[0m';
  console.log(`  ${icon} ${suiteName}: ${suitePass} passed, ${suiteFail} failed`);

  totalPass += suitePass;
  totalFail += suiteFail;
}

if (failures.length > 0) {
  console.log(`\n  ${'─'.repeat(40)}`);
  console.log('  \x1b[31mFailures:\x1b[0m\n');
  for (const f of failures) {
    console.log(`  \x1b[31m\u2717\x1b[0m [${f.suite}] ${f.test}`);
    console.log(`    ${f.error}\n`);
  }
}

console.log(`  ${'─'.repeat(40)}`);
const color = totalFail === 0 ? '\x1b[32m' : '\x1b[31m';
console.log(`  ${color}${totalPass} passed, ${totalFail} failed\x1b[0m\n`);

process.exit(totalFail === 0 ? 0 : 1);
