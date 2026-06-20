import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const dir = path.join(process.cwd(), 'questions');
const mem = {};
for (const cat of fs.readdirSync(dir)) {
  const full = path.join(dir, cat);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith('.md')) continue;
    const { data } = matter(fs.readFileSync(path.join(full, f), 'utf-8'));
    const cats = Array.isArray(data.categories) ? data.categories : [data.category || cat];
    for (const c of cats) mem[c] = (mem[c] || 0) + 1;
  }
}
console.log('membership counts (as Next.js build sees them):');
let total = 0;
for (const c of Object.keys(mem).sort()) { console.log('  ' + c + ': ' + mem[c]); total += mem[c]; }
console.log('TOTAL entries:', total);
