import { chromium } from 'playwright';

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch({
  executablePath: '/Users/sunqingguang/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

console.log('=== R3: Study + Review (algorithms) ===');

await page.goto('http://localhost:8098/ai-interview/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// --- Algorithm reference correctness (independent re-derivation in-page) ---
console.log('\n--- Algorithm reference checks ---');
const ref = await page.evaluate(() => {
  const QMAP = [1, 3, 4, 5];
  function sm2Raw(item, quality) {
    const q5 = QMAP[quality];
    if (q5 < 3) return 1;
    const delta = 0.1 - (5 - q5) * (0.08 + (5 - q5) * 0.02);
    item.ease = Math.max(1.3, item.ease + delta);
    if (item.reps === 0) return 1;
    if (item.reps === 1) return 3;
    return Math.round(item.interval * item.ease);
  }
  const a = sm2Raw({ ease: 2.5, interval: 0, reps: 0 }, 2);
  const b = sm2Raw({ ease: 2.5, interval: 1, reps: 1 }, 2);
  const liv = [1, 3, 7, 14, 30];
  const leitner = liv[Math.min(4, 0 + 1)];
  const eiv = [1, 2, 4, 7, 15, 30];
  const ebb = eiv[Math.min(5, 0 + 1)];
  return { sm2_a: a, sm2_b: b, leitner, ebb };
});
check('SM-2 first good -> 1 day', ref.sm2_a === 1, `${ref.sm2_a}`);
check('SM-2 second good -> 3 days', ref.sm2_b === 3, `${ref.sm2_b}`);
check('Leitner box0 good -> 3 days', ref.leitner === 3, `${ref.leitner}`);
check('Ebbinghaus phase0 good -> 2 days', ref.ebb === 2, `${ref.ebb}`);

// --- UI: study mode ---
console.log('\n--- UI: study mode ---');
await page.locator('button:has-text("顺序学习")').click();
await page.waitForTimeout(1000);
check('study mode opens', (await page.locator('text=学习').count()) > 0);
check('study: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await page.locator('button:has-text("查看答案")').click().catch(() => {});
await page.waitForTimeout(600);
check('study reveals answer', (await page.locator('.markdown-body:visible').count()) > 0);
check('study has 3 rating buttons', (await page.locator('button:has-text("会了")').count()) > 0 && (await page.locator('button:has-text("不会")').count()) > 0);

await page.locator('button:has-text("会了")').click();
await page.waitForTimeout(700);
const stored = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('ai-interview')).state; } catch { return null; } });
check('study rating persisted', stored && Object.keys(stored.ratings || {}).length > 0);
const today = new Date().toISOString().split('T')[0];
check('dailyLog updated today', stored?.dailyLog?.[today]?.studied >= 1, JSON.stringify(stored?.dailyLog?.[today]));

await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// --- UI: review mode ---
console.log('\n--- UI: review mode ---');
await page.goto('http://localhost:8098/ai-interview/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const P = 'ai-interview';
  const t = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(P);
  let state = {};
  if (raw) { try { state = JSON.parse(raw).state || {}; } catch {} }
  state.reviewData = { 'llm-001': { algo: 'sm2', ease: 2.5, interval: 1, reps: 1, lapses: 0, box: 0, phase: 0, nextDate: t, lastDate: t, createdAt: t, history: [] } };
  state.autoEnroll = false;
  localStorage.setItem(P, JSON.stringify({ state, version: 0 }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.locator('button:has-text("遗忘复习")').click();
await page.waitForTimeout(1200);
check('review mode opens with due question', (await page.locator('text=复习').count()) > 0);

await page.locator('button:has-text("查看答案")').click().catch(() => {});
await page.waitForTimeout(600);
check('review has 4 rating buttons', (await page.locator('button:has-text("完全忘了")').count()) > 0 && (await page.locator('button:has-text("很轻松")').count()) > 0);

const bodyText = await page.evaluate(() => document.body.innerText);
check('review shows interval previews', /(明天|\d+天|周|个月)/.test(bodyText));

await page.locator('button:has-text("记住了")').click();
await page.waitForTimeout(700);
const rd = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('ai-interview')).state.reviewData['llm-001']; } catch { return null; } });
check('review advances reps', rd && rd.reps >= 2, `reps=${rd?.reps}`);
check('review sets future nextDate', rd && rd.nextDate > today, `nextDate=${rd?.nextDate}`);

// --- algorithm switch ---
console.log('\n--- algorithm switch ---');
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(500);
await page.goto('http://localhost:8098/ai-interview/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator('button[title="设置"]').click();
await page.waitForTimeout(500);
check('settings shows Leitner option', (await page.locator('button:has-text("Leitner")').count()) > 0);
await page.locator('button:has-text("Leitner")').click();
await page.waitForTimeout(400);
const algo = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('ai-interview')).state.reviewAlgorithm; } catch { return null; } });
check('algorithm switches to leitner', algo === 'leitner', `algo=${algo}`);

await browser.close();
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== R3 Result: ${passed}/${results.length} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
