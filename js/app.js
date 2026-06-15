/**
 * AI Interview — App Logic
 * 数据展示分离架构：fetch JSON → 渲染 → 交互
 */
'use strict';

// ============ State ============
const State = {
  allQuestions: [],      // 全部题目
  filtered: [],          // 当前筛选结果
  currentCategory: 'all',
  currentDifficulty: 'all',
  currentSubcategory: 'all',
  showFavoritesOnly: false,
  searchQuery: '',
  favorites: new Set(JSON.parse(localStorage.getItem('ai-interview.favorites') || '[]')),
  viewed: new Set(JSON.parse(localStorage.getItem('ai-interview.viewed') || '[]')),
  theme: localStorage.getItem('ai-interview.theme') || 'light',
};

// ============ Category Config ============
const CATEGORIES = {
  'all':              { label: '全部', icon: '📚', color: '#0071e3', file: null },
  'ai-basics':        { label: 'AI 基础', icon: '🧠', color: '#34c759', file: 'data/ai-basics.json' },
  'ai-agent':         { label: 'AI Agent', icon: '🤖', color: '#af52de', file: 'data/ai-agent.json' },
  'ai-harness':       { label: 'AI Harness', icon: '⚙️', color: '#ff9500', file: 'data/ai-harness.json' },
  'llm-100':          { label: 'LLM面试100问', icon: '🔥', color: '#ff3b30', file: 'data/llm-100.json' },
  'agent-concept':    { label: 'Agent基础概念', icon: '💡', color: '#5856d6', file: 'data/agent-concept.json' },
  'agent-framework':  { label: '核心框架', icon: '⚙️', color: '#007aff', file: 'data/agent-framework.json' },
  'agent-rag':        { label: 'RAG技术', icon: '🔍', color: '#34c759', file: 'data/agent-rag.json' },
  'agent-tools':      { label: '工具调用', icon: '🔧', color: '#ff9500', file: 'data/agent-tools.json' },
  'agent-memory':     { label: '记忆系统', icon: '💾', color: '#af52de', file: 'data/agent-memory.json' },
  'agent-multi':      { label: '多智能体', icon: '🤝', color: '#ff2d55', file: 'data/agent-multi.json' },
  'agent-llm':        { label: '大模型基础', icon: '🧪', color: '#5ac8fa', file: 'data/agent-llm.json' },
  'agent-eng':        { label: '工程化实践', icon: '🏗️', color: '#ff6b35', file: 'data/agent-eng.json' },
  'agent-prompt':     { label: 'Prompt工程', icon: '✏️', color: '#ffd60a', file: 'data/agent-prompt.json' },
  'agent-interview-qa': { label: '企业面试问答', icon: '💼', color: '#1d1d1f', file: 'data/agent-interview-qa.json' },
  'llm-notes':          { label: 'LLM基础与实践', icon: '📖', color: '#008080', file: 'data/llm-notes.json' },
};

// ============ Init ============
async function init() {
  applyTheme();
  await loadAllData();
  bindEvents();
  applyFilters();
  updateProgress();
  hideLoader();
}

// ============ Data Loading ============
async function loadAllData() {
  const results = await Promise.all(
    Object.entries(CATEGORIES)
      .filter(([k, v]) => v.file)
      .map(async ([key, cfg]) => {
        const res = await fetch(cfg.file);
        const data = await res.json();
        data.forEach(q => { q._category = key; });
        return data;
      })
  );
  State.allQuestions = results.flat();
  // Render category counts
  Object.entries(CATEGORIES).forEach(([key]) => {
    if (key === 'all') return;
    const count = State.allQuestions.filter(q => q._category === key).length;
    const el = document.querySelector(`[data-cat="${key}"] .count`);
    if (el) el.textContent = count;
  });
  const allEl = document.querySelector('[data-cat="all"] .count');
  if (allEl) allEl.textContent = State.allQuestions.length;
}

// ============ Rendering ============
function applyFilters() {
  State.filtered = State.allQuestions.filter(q => {
    if (State.currentCategory !== 'all' && q._category !== State.currentCategory) return false;
    if (State.currentDifficulty !== 'all' && q.difficulty !== State.currentDifficulty) return false;
    if (State.currentSubcategory !== 'all' && q.subcategory !== State.currentSubcategory) return false;
    if (State.showFavoritesOnly && !State.favorites.has(q.id)) return false;
    if (State.searchQuery) {
      const q_lower = State.searchQuery.toLowerCase();
      const haystack = (q.question + ' ' + q.tags.join(' ') + ' ' + q.subcategory + ' ' + q.answer).toLowerCase();
      if (!haystack.includes(q_lower)) return false;
    }
    return true;
  });
  renderCards();
  renderSubcategoryFilter();
  updateStats();
}

function renderCards() {
  const grid = document.getElementById('cardsGrid');
  if (State.filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <h3>没有找到匹配的题目</h3>
        <p>试试调整筛选条件或搜索关键词</p>
      </div>`;
    return;
  }
  grid.innerHTML = State.filtered.map((q, i) => {
    const cat = CATEGORIES[q._category];
    const isFav = State.favorites.has(q.id);
    const isViewed = State.viewed.has(q.id);
    return `
      <div class="card" style="--card-accent: ${cat.color}; animation-delay: ${i * 0.03}s;" onclick="openModal('${q.id}')">
        <div class="card__header">
          <span class="card__id">${q.id.toUpperCase()}</span>
          <span class="card__difficulty" data-level="${q.difficulty}">${q.difficulty}</span>
        </div>
        <div class="card__question">${escapeHtml(q.question)}</div>
        <div class="card__tags">
          ${q.tags.slice(0, 4).map(t => `<span class="card__tag">${escapeHtml(t)}</span>`).join('')}
          ${q.images && q.images.length > 0 ? `<span class="card__tag" style="color:var(--info);">🖼️ ${q.images.length}</span>` : ''}
          ${isViewed ? '<span class="card__tag" style="color:var(--success);">✓ 已看</span>' : ''}
        </div>
        <button class="card__fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite('${q.id}', this)" title="收藏">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>`;
  }).join('');
}

function renderSubcategoryFilter() {
  const container = document.getElementById('subcategoryFilters');
  if (!container) return;
  const subs = [...new Set(
    State.allQuestions
      .filter(q => State.currentCategory === 'all' || q._category === State.currentCategory)
      .map(q => q.subcategory)
  )].sort();
  container.innerHTML = subs.map(s => {
    const active = State.currentSubcategory === s ? 'active' : '';
    return `<button class="filter-chip ${active}" onclick="setSubcategory('${escapeAttr(s)}')">${escapeHtml(s)}</button>`;
  }).join('');
}

function updateStats() {
  const total = State.allQuestions.length;
  const viewed = State.viewed.size;
  const favCount = State.favorites.size;
  const filteredCount = State.filtered.length;

  const elTotal = document.getElementById('statTotal');
  const elViewed = document.getElementById('statViewed');
  const elFav = document.getElementById('statFav');
  const elShown = document.getElementById('statShown');
  if (elTotal) elTotal.textContent = total;
  if (elViewed) elViewed.textContent = viewed;
  if (elFav) elFav.textContent = favCount;
  if (elShown) elShown.textContent = filteredCount;
}

// ============ Modal ============
function openModal(id) {
  const q = State.allQuestions.find(x => x.id === id);
  if (!q) return;
  State.viewed.add(id);
  localStorage.setItem('ai-interview.viewed', JSON.stringify([...State.viewed]));
  updateProgress();

  const cat = CATEGORIES[q._category];
  const isFav = State.favorites.has(q.id);

  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');

  modal.innerHTML = `
    <div class="modal__header">
      <div class="modal__meta">
        <span class="card__id">${q.id.toUpperCase()}</span>
        <span class="card__difficulty" data-level="${q.difficulty}">${q.difficulty}</span>
        <span class="card__tag" style="border-color:${cat.color};color:${cat.color};">${cat.icon} ${cat.label}</span>
        <span class="card__tag">${escapeHtml(q.subcategory)}</span>
      </div>
      <h2 class="modal__question">${escapeHtml(q.question)}</h2>
      <button class="modal__close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal__body">
      <div class="modal__section">
        <div class="modal__label">📖 参考答案</div>
        <div class="modal__answer markdown-body">${renderMarkdown(q.answer)}</div>
      </div>
      ${q.images && q.images.length > 0 ? `
      <div class="modal__section">
        <div class="modal__label">🖼️ 配图 (${q.images.length})</div>
        <div class="modal__images">
          ${q.images.map(img => `<img class="modal__image" src="images/${img}" alt="${escapeAttr(img)}" loading="lazy" onclick="openImageFullscreen(this)">`).join('')}
        </div>
      </div>` : ''}
      ${q.follow_up && q.follow_up.length ? `
      <div class="modal__section">
        <div class="modal__label">❓ 延伸追问</div>
        <div class="modal__followup">
          ${q.follow_up.map(f => `
            <div class="followup-item" onclick="closeModal(); searchAndOpen('${escapeAttr(f)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              ${escapeHtml(f)}
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      <div class="modal__section">
        <button class="followup-item" style="justify-content:center;" onclick="toggleFavorite('${q.id}', null); closeModal(); renderCards();">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${isFav ? '取消收藏' : '添加收藏'}
        </button>
      </div>
    </div>`;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  closeImageFullscreen();
  // Re-render cards to update viewed status
  renderCards();
  updateStats();
}

// ============ Image Fullscreen Viewer ============
function openImageFullscreen(img) {
  let viewer = document.getElementById('imageViewer');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'imageViewer';
    viewer.className = 'image-viewer';
    viewer.onclick = (e) => { if (e.target === viewer) closeImageFullscreen(); };
    document.body.appendChild(viewer);
  }
  viewer.innerHTML = `
    <button class="image-viewer__close" onclick="closeImageFullscreen()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    <img class="image-viewer__img" src="${img.src}" alt="${img.alt}">
  `;
  viewer.classList.add('active');
}

function closeImageFullscreen() {
  const viewer = document.getElementById('imageViewer');
  if (viewer) viewer.classList.remove('active');
}

function searchAndOpen(query) {
  // Extract keywords from follow-up question
  const keywords = query.replace(/[？?]/g, '').trim();
  // Try to find a matching question
  const match = State.allQuestions.find(q =>
    q.question.includes(keywords) ||
    keywords.split(/[，,、]/).some(kw => kw.length > 2 && q.question.includes(kw))
  );
  if (match) {
    openModal(match.id);
  } else {
    // Search with the keywords
    document.getElementById('searchInput').value = keywords;
    State.searchQuery = keywords;
    applyFilters();
  }
}

// ============ Favorites ============
function toggleFavorite(id, btnEl) {
  if (State.favorites.has(id)) {
    State.favorites.delete(id);
  } else {
    State.favorites.add(id);
  }
  localStorage.setItem('ai-interview.favorites', JSON.stringify([...State.favorites]));
  if (btnEl) {
    const isFav = State.favorites.has(id);
    btnEl.classList.toggle('active', isFav);
    const svg = btnEl.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  }
  updateStats();
}

// ============ Progress ============
function updateProgress() {
  const total = State.allQuestions.length;
  const viewed = State.viewed.size;
  const pct = total > 0 ? Math.round((viewed / total) * 100) : 0;
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  if (fill) {
    const circumference = 2 * Math.PI * 24; // radius=24
    fill.style.strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
  }
  if (text) text.textContent = `${pct}%`;
}

// ============ Filters ============
function setCategory(cat) {
  State.currentCategory = cat;
  State.currentSubcategory = 'all';
  document.querySelectorAll('.category-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  applyFilters();
}
function setDifficulty(diff) {
  State.currentDifficulty = diff;
  document.querySelectorAll('[data-diff]').forEach(t => {
    t.classList.toggle('active', t.dataset.diff === diff);
  });
  applyFilters();
}
function setSubcategory(sub) {
  State.currentSubcategory = sub;
  applyFilters();
}
function toggleFavoritesOnly() {
  State.showFavoritesOnly = !State.showFavoritesOnly;
  const btn = document.getElementById('favFilter');
  if (btn) btn.classList.toggle('active', State.showFavoritesOnly);
  applyFilters();
}

// ============ Theme ============
function applyTheme() {
  document.documentElement.setAttribute('data-theme', State.theme);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = State.theme === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}
function toggleTheme() {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('ai-interview.theme', State.theme);
  applyTheme();
}

// ============ Settings Panel ============
function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('active');
  document.getElementById('settingsOverlay').classList.toggle('active');
}

// ============ Keyboard ============
function handleKeyboard(e) {
  if (e.key === 'Escape') {
    const viewer = document.getElementById('imageViewer');
    if (viewer && viewer.classList.contains('active')) closeImageFullscreen();
    else if (document.getElementById('modalOverlay').classList.contains('active')) closeModal();
    else if (document.getElementById('settingsPanel').classList.contains('active')) toggleSettings();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
}

// ============ Markdown Renderer (Lightweight) ============
function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  // Tables (must be before other transforms)
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (match, header, sep, body) => {
    const headers = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`);
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    });
    return `<table><thead><tr>${headers.join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  });
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Line breaks → paragraphs
  html = html.split(/\n\n+/).map(block => {
    if (block.match(/^<(h\d|ul|ol|pre|table|blockquote)/)) return block;
    if (block.trim() === '') return '';
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  return html;
}

// ============ Utils ============
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s) {
  return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// ============ Event Binding ============
function bindEvents() {
  // Search
  const search = document.getElementById('searchInput');
  if (search) {
    let debounce;
    search.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        State.searchQuery = e.target.value.trim();
        applyFilters();
      }, 200);
    });
  }
  // Theme
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  // Settings
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', toggleSettings);
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (settingsOverlay) settingsOverlay.addEventListener('click', toggleSettings);
  // Modal overlay click to close
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  // Progress ring click → scroll top
  const ring = document.getElementById('progressRing');
  if (ring) ring.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  // Keyboard
  document.addEventListener('keydown', handleKeyboard);
  // Reset progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('确定要重置学习进度吗？此操作不可撤销。')) {
      State.viewed.clear();
      localStorage.removeItem('ai-interview.viewed');
      updateProgress();
      renderCards();
      updateStats();
    }
  });
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
