import { chromium } from 'playwright';

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch({
  executablePath: '/Users/sunqingguang/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
});
const ctx = await browser.newContext({ acceptDownloads: true });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

console.log('=== R4: Data Compatibility + Exports ===');

// --- Legacy localStorage migration ---
console.log('\n--- Legacy localStorage migration ---');
await page.goto('http://localhost:8098/ai-interview/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.waitForTimeout(300);

// Seed LEGACY per-field keys exactly as the old vanilla JS app stored them
await page.evaluate(() => {
  const P = 'ai-interview';
  localStorage.setItem(P + '.favorites', JSON.stringify(['llm-001', 'llm-002']));
  localStorage.setItem(P + '.viewed', JSON.stringify(['llm-001']));
  localStorage.setItem(P + '.notes', JSON.stringify({ 'llm-001': 'legacy note text' }));
  localStorage.setItem(P + '.ratings', JSON.stringify({ 'llm-001': 'know' }));
  localStorage.setItem(P + '.theme', JSON.stringify('dark'));
  localStorage.setItem(P + '.sortOrder', JSON.stringify('easy-first'));
  localStorage.setItem(P + '.searchHistory', JSON.stringify(['Transformer', 'RAG']));
  localStorage.setItem(P + '.streak', JSON.stringify(5));
  localStorage.setItem(P + '.dailyGoal', JSON.stringify(25));
  const t = new Date().toISOString().split('T')[0];
  localStorage.setItem(P + '.reviewData', JSON.stringify({ 'llm-001': { algo: 'sm2', ease: 2.5, interval: 1, reps: 1, lapses: 0, box: 0, phase: 0, nextDate: t, lastDate: t, createdAt: t, history: [] } }));
  localStorage.setItem(P + '.reviewAlgorithm', JSON.stringify('leitner'));
});
// reload to trigger migrateLegacyStorage in ClientBootstrap
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const migrated = await page.evaluate(() => {
  const P = 'ai-interview';
  const raw = localStorage.getItem(P);
  if (!raw) return { merged: false };
  const parsed = JSON.parse(raw);
  return { merged: true, state: parsed.state, legacyStillPresent: !!localStorage.getItem(P + '.favorites') };
});
check('legacy keys merged into zustand blob', migrated.merged === true);
check('favorites migrated', migrated.state?.favorites?.length === 2, JSON.stringify(migrated.state?.favorites));
check('notes migrated', migrated.state?.notes?.['llm-001'] === 'legacy note text');
check('ratings migrated', migrated.state?.ratings?.['llm-001'] === 'know');
check('theme migrated', migrated.state?.theme === 'dark');
check('sortOrder migrated', migrated.state?.sortOrder === 'easy-first');
check('searchHistory migrated', JSON.stringify(migrated.state?.searchHistory) === JSON.stringify(['Transformer', 'RAG']));
check('streak migrated', migrated.state?.streak === 5);
check('dailyGoal migrated', migrated.state?.dailyGoal === 25);
check('reviewAlgorithm migrated', migrated.state?.reviewAlgorithm === 'leitner');
check('reviewData migrated', !!migrated.state?.reviewData?.['llm-001']);

// verify migrated data is reflected in the UI (favorites show as favorited)
await page.waitForTimeout(500);
const favApplied = await page.evaluate(() => {
  // the store should have favorites = [llm-001, llm-002]
  return JSON.parse(localStorage.getItem('ai-interview')).state.favorites;
});
check('migrated favorites usable by store', JSON.stringify(favApplied) === JSON.stringify(['llm-001', 'llm-002']));

// theme applied to document
const appliedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
check('migrated dark theme applied to DOM', appliedTheme === 'dark', `theme=${appliedTheme}`);

// --- Exports ---
console.log('\n--- Exports ---');
// inject wrong ratings so the wrong-book export is non-empty
await page.evaluate(() => {
  const raw = localStorage.getItem('ai-interview');
  const parsed = JSON.parse(raw);
  parsed.state.ratings = { ...(parsed.state.ratings || {}), 'llm-002': 'dont', 'llm-003': 'fuzzy' };
  localStorage.setItem('ai-interview', JSON.stringify(parsed));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// open settings and trigger exportProgress (clipboard + download)
await page.locator('button[title="设置"]').click();
await page.waitForTimeout(500);
check('settings panel opens', (await page.locator('text=导出').count()) > 0);

const downloadPaths = [];
page.on('download', async (d) => {
  const p = '/tmp/dl-' + d.suggestedFilename();
  await d.saveAs(p);
  downloadPaths.push(p);
});

await page.locator('button:has-text("导出学习进度")').click();
await page.waitForTimeout(1500);
check('export triggered downloads', downloadPaths.length >= 1, `${downloadPaths.length} files: ${downloadPaths.map(p => p.split('/').pop()).join(', ')}`);

// verify export content (the JSON backup should contain favorites)
const fs = await import('fs');
let backupOk = false;
let progressOk = false;
for (const p of downloadPaths) {
  const content = fs.readFileSync(p, 'utf-8');
  if (p.includes('backup')) {
    try {
      const j = JSON.parse(content);
      backupOk = JSON.stringify(j.favorites) === JSON.stringify(['llm-001', 'llm-002']) && !!j.reviewData?.['llm-001'];
    } catch {}
  }
  if (p.includes('study-progress')) progressOk = content.includes('学习进度');
}
// progress report may have gone to clipboard instead of a file
if (!progressOk) {
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  progressOk = clip.includes('学习进度报告');
}
check('backup JSON contains favorites + reviewData', backupOk);
check('progress report exported (file or clipboard)', progressOk);

// wrong-book export
const dlCountBefore = downloadPaths.length;
await page.locator('button:has-text("导出错题本")').click();
await page.waitForTimeout(1500);
let wrongBookOk = downloadPaths.length > dlCountBefore;
if (wrongBookOk) {
  const wbFile = downloadPaths[downloadPaths.length - 1];
  const wbContent = fs.readFileSync(wbFile, 'utf-8');
  wrongBookOk = wbContent.includes('错题本') && wbContent.includes('llm-002');
}
check('wrong-book export produces correct file', wrongBookOk);

await browser.close();
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== R4 Result: ${passed}/${results.length} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
