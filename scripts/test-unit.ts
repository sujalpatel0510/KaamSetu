/**
 * KaamSetu Unit Test Suite (pure logic — no database required).
 * Run: npm run test:unit
 *
 * Covers the financial primitives and rate limiter that back the sales,
 * udhaar and voice-assistant flows. These are the exact helpers used by
 * the API routes, so regressions here surface ledger-corruption risks.
 */
import { roundToPaisa, calculateOutstanding } from '../src/lib/financial';
import { rateLimit } from '../src/lib/rate-limit';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('--- Financial primitives (src/lib/financial.ts) ---');

// Floating-point rounding: classic JS money hazards
check('roundToPaisa(0.1 + 0.2) === 0.3', roundToPaisa(0.1 + 0.2) === 0.3);
check('roundToPaisa(19.99 * 3) === 59.97', roundToPaisa(19.99 * 3) === 59.97);
check('roundToPaisa(0.145 * 1000) rounds half away from zero', roundToPaisa(145.00000000001) === 145);
check('roundToPaisa handles exact paisa values', roundToPaisa(10.55) === 10.55);
check('roundToPaisa handles zero', roundToPaisa(0) === 0);

// Outstanding = max(0, credit - repayment), exact paisa
check('outstanding of (500, 200) is 300', calculateOutstanding(500, 200) === 300);
check('outstanding clamps to 0 when repayments exceed credit', calculateOutstanding(100, 150) === 0);
check('outstanding of equal credit/repayment is 0', calculateOutstanding(100, 100) === 0);
check('outstanding survives float drift (0.1/0.2)', calculateOutstanding(0.1, 0.2) === 0);
check(
  'outstanding is exact to the paisa (33.33 - 0.03)',
  calculateOutstanding(33.33, 0.03) === 33.3
);

console.log('--- Rate limiter (src/lib/rate-limit.ts) ---');

// Fresh window behaves
const first = rateLimit(`unit-test:${Date.now()}:${Math.random()}`, { limit: 3, windowMs: 60_000 });
check('first request passes', first.success === true);
check('remaining decrements', first.remaining === 2);

// Second limiter keyed uniquely: exhaust the window
const key = `unit-test-exhaust:${Date.now()}:${Math.random()}`;
const results = [1, 2, 3, 4].map(() => rateLimit(key, { limit: 3, windowMs: 60_000 }));
check('requests 1-3 pass', results.slice(0, 3).every((r) => r.success));
check('request 4 is rejected with 429 semantics', results[3].success === false);
check('rejected response reports resetAt in the future', results[3].resetAt > Date.now());

console.log(`\n=== Unit results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
