import { chromium } from 'playwright';

const BASE = 'http://localhost:8098/ai-interview';
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push('REQFAIL: ' + r.url()));

console.log('=== R2: Core Features ===');

// 1. Home loads with questions (cards rendered client-side)
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
// Cards are divs with onClick cursor:pointer — count by a stable marker: the fav heart button
const favButtons = await page.locator('button[aria-label="收藏"]').count();
check('home renders question cards', favButtons > 0, `${favButtons} cards`);
check('no console errors on load', errors.length === 0, errors.slice(0, 3).join(' | '));

const title = await page.title();
check('page title set', title.includes('AI 面试题库'), title);

// 2. Category tabs
const catTabs = await page.locator('button:has-text("LLM 核心")').count();
check('category tabs rendered', catTabs > 0);

// 3. Click "LLM 核心" tab -> filters
await page.locator('button:has-text("LLM 核心")').first().click();
await page.waitForTimeout(600);
const favAfterCat = await page.locator('button[aria-label="收藏"]').count();
check('category filter reduces list', favAfterCat > 0 && favAfterCat <= 272, `${favAfterCat} cards in llm-core`);

// 4. Search
await page.fill('#search-input', 'Transformer');
await page.waitForTimeout(800);
const searchResults = await page.locator('button[aria-label="收藏"]').count();
check('search returns results', searchResults > 0, `${searchResults} results`);
const highlights = await page.locator('mark.search-hit').count();
check('search highlight marks present', highlights > 0, `${highlights} marks`);

// 5. Clear search
await page.fill('#search-input', '');
await page.waitForTimeout(500);

// 6. Open modal (click first card)
await page.locator('button[aria-label="收藏"]').first().click().catch(async () => {
  // click the card container instead
  const card = page.locator('div[style*="cursor: pointer"]').first();
  await card.click();
});
// The above clicks the fav button; instead click the card body. Re-do:
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(300);
// click on the question text area of first card
const firstCard = page.locator('div[style*="cursor: pointer"]').first();
await firstCard.click();
await page.waitForTimeout(1000);

const modalMd = await page.locator('.markdown-body:visible').count();
check('modal opens with markdown answer', modalMd > 0);
const modalText = await page.locator('body').innerText();
check('modal shows feynman section', modalText.includes('费曼') || modalText.includes('本质'));

// 7. Modal actions
check('modal has favorite button', (await page.locator('button:has-text("收藏")').count()) > 0);
check('modal has copy button', (await page.locator('button:has-text("复制")').count()) > 0);
check('modal has share button', (await page.locator('button:has-text("分享")').count()) > 0);
check('modal has notes textarea', (await page.locator('textarea:visible').count()) > 0);

// 8. Close modal Esc
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('modal closes on Esc', (await page.locator('textarea:visible').count()) === 0);

// 9. Static detail page
await page.goto(BASE + '/question/llm-001/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
check('static detail page renders answer', (await page.locator('.markdown-body').count()) > 0);
const detailText = await page.locator('body').innerText();
check('static detail page has feynman', detailText.includes('费曼') || detailText.includes('本质'));

// 10. Theme toggle
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await page.locator('button[title="主题 (D)"]').click();
await page.waitForTimeout(400);
const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
check('theme toggles', themeBefore !== themeAfter, `${themeBefore} -> ${themeAfter}`);

// 11. Difficulty distribution bar rendered
const bars = await page.locator('div[title]').filter({ hasText: /L[1-5]:/ }).count();
check('difficulty bars rendered', bars > 0, `${bars} bars`);

await browser.close();

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== R2 Result: ${passed}/${results.length} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
