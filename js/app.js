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
  sortOrder: localStorage.getItem('ai-interview.sortOrder') || 'easy-first', // 'easy-first' | 'hard-first' | 'default'
};

// ============ Category Config ============
// 7 大分类，每个分类可包含多个数据文件
const CATEGORIES = {
  'all':              { label: '全部', icon: '📚', color: '#0071e3', files: null },
  'llm-core':         { label: 'LLM 核心', icon: '🔥', color: '#ff3b30', files: ['data/llm-100.json', 'data/llm-notes.json', 'data/new-llm-core.json'] },
  'ai-agent':         { label: 'AI Agent', icon: '🤖', color: '#af52de', files: ['data/ai-agent.json', 'data/agent-concept.json', 'data/agent-framework.json', 'data/agent-multi.json', 'data/new-agent-arch.json', 'data/agent-rag.json', 'data/agent-tools.json', 'data/agent-memory.json', 'data/agent-prompt.json', 'data/agent-llm.json', 'data/new-agent-skill.json'] },
  'ai-harness':       { label: 'AI Harness', icon: '🏗️', color: '#5856d6', files: ['data/ai-harness.json', 'data/agent-eng.json'] },
  'fde':              { label: 'FDE', icon: '🚀', color: '#00c7be', files: ['data/fde.json'] },
  'eng-practice':     { label: '工程化实战', icon: '⚙️', color: '#ff9500', files: ['data/agent-interview-qa.json', 'data/new-eng-practice.json'] },
  'ai-basics':        { label: 'AI 基础', icon: '🧠', color: '#34c759', files: ['data/ai-basics.json', 'data/new-ai-basics.json'] },
};

// ============ Subcategory Group Mapping (78 raw → 10 clean modules, aligned with 5 categories) ============
const SUBCAT_GROUPS = {
  // LLM 核心
  'Transformer': ['Transformer架构', '注意力机制', '位置编码', '归一化', '激活函数', '模型结构', '模型架构'],
  '训练与微调': ['训练与微调', '训练优化', 'LoRA与微调', '参数高效微调', '微调策略', 'SFT与RLHF', '对齐技术', '对齐训练', '训练理论', '分布式训练'],
  'LLM前沿': ['LLM前沿', 'DeepSeek-R1', '强化学习', 'Tokenizer', '多模态', 'Text2SQL', 'LLM推荐', '实验管理'],

  // AI Agent（合并原 Agent架构 + Agent技能）
  'AI Agent': ['Agent基础概念', 'Agent核心框架', 'Agent架构', 'Agent稳定性', 'Agent评估', '工具调用', 'Function Calling', '工具使用', '记忆系统', 'Agent记忆', '规划与推理', '多智能体', '多智能体系统', '多Agent系统', 'Prompt工程', 'Prompt Engineering'],
  'RAG': ['RAG技术', 'RAG进阶', 'RAG与向量检索', '向量检索'],

  // AI Harness（合并原 推理与部署 + 评测与安全）
  'AI Harness': ['推理优化', '推理与部署', '生产工程化', '生产化部署', '模型服务', '模型部署', '部署架构', '工程化', '工程化实践', '工程实践', 'Agent工程化', 'Agent框架', 'LLM框架', 'RAG工程化', '向量数据库', '可观测性', '评估与安全', '评估', '评估指标', '评测与质量', 'Agent安全', '安全'],

  // AI 基础
  '大模型基础': ['大模型基础', '大模型架构', '大模型原理', '大模型综合', '大模型应用', '基础知识', '预训练模型', '表示学习', '长上下文'],

  // FDE（前沿部署工程师）
  'FDE': ['FDE基础概念', 'FDE工作实践', 'AI解决方案设计', 'AI部署实施', '数据安全与合规'],

  // 工程化实战
  '面试实战': ['企业面试问答', '手撕代码', 'AI编程', '文档处理'],
};

// Reverse lookup: raw subcategory → group name
const SUBCAT_REVERSE = {};
Object.entries(SUBCAT_GROUPS).forEach(([group, subs]) => {
  subs.forEach(s => { SUBCAT_REVERSE[s] = group; });
});

function getSubcatGroup(subcategory) {
  return SUBCAT_REVERSE[subcategory] || '其他';
}

// ============ Init ============
async function init() {
  applyTheme();
  // Restore sort button label
  const sortLabels = {'easy-first': '↑ 由浅入深', 'hard-first': '↓ 由深入浅', 'default': '↕ 默认排序'};
  const sortBtn = document.getElementById('sortToggle');
  if (sortBtn) { sortBtn.textContent = sortLabels[State.sortOrder]; sortBtn.classList.toggle('active', State.sortOrder !== 'default'); }
  await loadAllData();
  bindEvents();
  applyFilters();
  updateProgress();
  updateStudyDashboard();
  updateReviewDashboard();
  hideLoader();
}

// ============ Data Loading ============
async function loadAllData() {
  const fileCatMap = {}; // fileName → categoryKey
  Object.entries(CATEGORIES).forEach(([key, cfg]) => {
    if (cfg.files) {
      cfg.files.forEach(f => { fileCatMap[f] = key; });
    }
  });
  const uniqueFiles = [...new Set(Object.keys(fileCatMap))];
  const results = await Promise.all(
    uniqueFiles.map(async (file) => {
      const res = await fetch(file);
      const data = await res.json();
      data.forEach(q => { q._category = fileCatMap[file]; });
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
    if (State.currentSubcategory !== 'all' && getSubcatGroup(q.subcategory) !== State.currentSubcategory) return false;
    if (State.showFavoritesOnly && !State.favorites.has(q.id)) return false;
    if (State.searchQuery) {
      const q_lower = State.searchQuery.toLowerCase();
      const haystack = (q.question + ' ' + q.tags.join(' ') + ' ' + q.subcategory + ' ' + q.answer).toLowerCase();
      if (!haystack.includes(q_lower)) return false;
    }
    return true;
  });
  // Difficulty sort
  const diffOrder = {'L1':1,'L2':2,'L3':3,'L4':4,'L5':5};
  if (State.sortOrder === 'easy-first') {
    State.filtered.sort((a, b) => (diffOrder[a.difficulty]||99) - (diffOrder[b.difficulty]||99));
  } else if (State.sortOrder === 'hard-first') {
    State.filtered.sort((a, b) => (diffOrder[b.difficulty]||0) - (diffOrder[a.difficulty]||0));
  }
  renderCards();
  renderSubcategoryFilter();
  updateStats();
}

function toggleSort() {
  const order = ['easy-first', 'hard-first', 'default'];
  const idx = order.indexOf(State.sortOrder);
  State.sortOrder = order[(idx + 1) % order.length];
  localStorage.setItem('ai-interview.sortOrder', State.sortOrder);
  const btn = document.getElementById('sortToggle');
  const labels = {'easy-first': '↑ 由浅入深', 'hard-first': '↓ 由深入浅', 'default': '↕ 默认排序'};
  btn.textContent = labels[State.sortOrder];
  btn.classList.toggle('active', State.sortOrder !== 'default');
  applyFilters();
}

function highlightSearch(text) {
  if (!State.searchQuery) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const pattern = State.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<mark class="search-hit">$1</mark>');
}

function tagClick(tag) {
  const input = document.getElementById('searchInput');
  input.value = tag;
  State.searchQuery = tag;
  applyFilters();
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
    const reviewItem = ReviewEngine.getItem(q.id);
    const isMastered = reviewItem && (
      (reviewItem.algo === 'leitner' && reviewItem.box >= 4) ||
      (reviewItem.algo === 'ebbinghaus' && reviewItem.phase >= 5) ||
      (reviewItem.algo === 'sm2' && reviewItem.interval >= 21)
    );
    const isDue = reviewItem && reviewItem.nextDate <= new Date().toISOString().split('T')[0];
    return `
      <div class="card" style="--card-accent: ${cat.color}; animation-delay: ${i * 0.03}s;" onclick="openModal('${q.id}')">
        <div class="card__header">
          <span class="card__id">${q.id.toUpperCase()}</span>
          <span class="card__difficulty" data-level="${q.difficulty}">${q.difficulty}</span>
          ${isMastered ? '<span class="card__tag" style="color:var(--success);border-color:var(--success);">✓ 已掌握</span>' : ''}
          ${isDue && !isMastered ? '<span class="card__tag" style="color:var(--orange);border-color:var(--orange);">🔁 待复习</span>' : ''}
        </div>
        <div class="card__question">${highlightSearch(q.question)}</div>
        <div class="card__tags">
          ${q.tags.slice(0, 4).map(t => `<span class="card__tag" onclick="event.stopPropagation(); tagClick('${escapeHtml(t)}')" style="cursor:pointer;" title="点击筛选">${escapeHtml(t)}</span>`).join('')}
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
  // Use grouped subcategories instead of raw 78 values
  const groups = [...new Set(
    State.allQuestions
      .filter(q => State.currentCategory === 'all' || q._category === State.currentCategory)
      .map(q => getSubcatGroup(q.subcategory))
  )].sort();
  container.innerHTML = groups.map(g => {
    const count = State.allQuestions.filter(q => 
      (State.currentCategory === 'all' || q._category === State.currentCategory) &&
      getSubcatGroup(q.subcategory) === g
    ).length;
    const active = State.currentSubcategory === g ? 'active' : '';
    return `<button class="filter-chip ${active}" onclick="setSubcategory('${escapeAttr(g)}')">${escapeHtml(g)} <span style="opacity:0.5;font-size:0.625rem;">${count}</span></button>`;
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

  // Difficulty distribution bars
  const diffCounts = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
  State.filtered.forEach(q => { if (diffCounts[q.difficulty] !== undefined) diffCounts[q.difficulty]++; });
  const diffEl = document.getElementById('diffBars');
  if (diffEl) {
    const max = Math.max(...Object.values(diffCounts), 1);
    diffEl.innerHTML = ['L1','L2','L3','L4','L5'].map(l => {
      const pct = (diffCounts[l] / max * 100).toFixed(0);
      return `<div class="diff-bar" data-l="${l}" style="width:${pct}%" title="${l}: ${diffCounts[l]}题"></div>`;
    }).join('');
  }
}

// ============ Modal ============
function openModal(id) {
  const q = State.allQuestions.find(x => x.id === id);
  if (!q) return;
  _currentModalIndex = State.filtered.findIndex(x => x.id === id);
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
        <span class="card__tag">${escapeHtml(getSubcatGroup(q.subcategory))}</span>
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
          ${q.images.map(img => `<img class="modal__image" src="images/${img}" alt="${escapeAttr(img)}" loading="eager" onclick="openImageFullscreen(this)">`).join('')}
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
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="followup-item" style="flex:1;justify-content:center;" onclick="toggleFavorite('${q.id}', null); closeModal(); renderCards();">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${isFav ? '取消收藏' : '添加收藏'}
          </button>
          <button class="followup-item" style="flex:1;justify-content:center;" onclick="copyAnswer('${q.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            复制答案
          </button>
          <button class="followup-item" style="flex:1;justify-content:center;" onclick="shareQuestion('${q.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            分享
          </button>
        </div>
      </div>
      <div class="modal__nav">
        <button class="modal__nav-btn" onclick="navModal(-1)" title="上一题 (←)">‹ 上一题</button>
        <span class="modal__nav-pos" id="modalNavPos"></span>
        <button class="modal__nav-btn" onclick="navModal(1)" title="下一题 (→)">下一题 ›</button>
      </div>
    </div>`;

  overlay.classList.add('active');
  // Scroll modal to top — use setTimeout to ensure DOM has painted
  setTimeout(() => {
    const modalEl = document.getElementById('modal');
    if (modalEl) modalEl.scrollTop = 0;
  }, 50);
  // Update nav position
  const navPos = document.getElementById('modalNavPos');
  if (navPos && _currentModalIndex >= 0) {
    navPos.textContent = `${_currentModalIndex + 1} / ${State.filtered.length}`;
  }
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
  const cleaned = query.replace(/[？?！!。.]/g, '').trim();
  
  // Strategy 1: Exact match
  let match = State.allQuestions.find(q => q.question === query || q.question === cleaned);
  if (match) { openModal(match.id); return; }

  // Strategy 2: Question contains the full follow-up text (or vice versa)
  match = State.allQuestions.find(q => q.question.includes(cleaned) || cleaned.includes(q.question));
  if (match) { openModal(match.id); return; }

  // Strategy 3: Extract core meaningful term and find best match
  const stopWords = new Set(['什么','是','如何','为什么','哪些','哪个','怎么','怎样','的','了','吗','呢','和','与','在','有','不','都','也','请','解释','说明','比较','区别','谈谈','概述','介绍','分析']);
  
  // Remove common question prefixes to get core term
  let core = cleaned;
  const prefixes = ['什么是','什么叫','如何','为什么','怎么','哪些','哪个','怎样','请问','简述','谈谈','请说明','请'];
  for (const p of prefixes) {
    if (core.startsWith(p)) { core = core.substring(p.length); break; }
  }
  core = core.replace(/[了吗呢啊呀吧的了吗呢]/g, '').trim();
  
  // Build candidate search terms: core + split keywords (sorted by length desc = most specific first)
  const splitKws = cleaned.split(/[\s，,、，和与的了吗呢和与在]/).filter(kw => kw.length >= 2 && !stopWords.has(kw));
  const searchTerms = [...new Set([core, ...splitKws])].filter(t => t.length >= 2).sort((a, b) => b.length - a.length);

  if (searchTerms.length > 0) {
    // Try each search term from most specific to least — open first match
    for (const term of searchTerms) {
      const termMatch = State.allQuestions.find(q => 
        q.question.includes(term) || 
        q.tags.some(t => t.includes(term)) ||
        q.subcategory.includes(term)
      );
      if (termMatch) { openModal(termMatch.id); return; }
    }
    
    // If no direct match, try pairwise: find question matching the most terms
    let bestMatch = null;
    let bestScore = 0;
    for (const q of State.allQuestions) {
      let score = 0;
      const qText = (q.question + ' ' + q.tags.join(' ') + ' ' + q.subcategory);
      for (const term of searchTerms) {
        if (qText.includes(term)) score++;
      }
      if (score > bestScore) { bestScore = score; bestMatch = q; }
    }
    if (bestMatch && bestScore >= 1) {
      openModal(bestMatch.id);
      return;
    }
  }

  // Strategy 4: Fall back to keyword search in card list
  const searchKw = searchTerms.length > 0 ? searchTerms[0] : cleaned;
  if (searchKw && searchKw.length >= 2) {
    document.getElementById('searchInput').value = searchKw;
    State.searchQuery = searchKw;
    State.currentCategory = 'all';
    State.currentDifficulty = 'all';
    document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === 'all'));
    document.querySelectorAll('.filter-chip[data-diff]').forEach(c => c.classList.toggle('active', c.dataset.diff === 'all'));
    applyFilters();
    if (State.filtered.length > 0) {
      showToast(`🔍 搜索"${searchKw}"，共 ${State.filtered.length} 题`);
    } else {
      // Last resort: broader search with first 2 chars
      const broad = searchKw.substring(0, 2);
      document.getElementById('searchInput').value = broad;
      State.searchQuery = broad;
      applyFilters();
      showToast(`🔍 模糊搜索"${broad}"，共 ${State.filtered.length} 题`);
    }
  } else {
    showToast('未找到相关题目');
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
  // '/' to focus search
  if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  // '?' to show shortcuts
  if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    toggleShortcuts();
  }
  // Arrow keys for modal navigation
  if (e.key === 'ArrowLeft' && document.getElementById('modalOverlay').classList.contains('active')) {
    navModal(-1);
  }
  if (e.key === 'ArrowRight' && document.getElementById('modalOverlay').classList.contains('active')) {
    navModal(1);
  }
  // 'L' for random question
  if ((e.key === 'l' || e.key === 'L') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    if (!StudyState.active && !ReviewState.active) randomQuestion();
  }
  // 'R' key to start review
  if (e.key === 'r' || e.key === 'R') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (!StudyState.active && !ReviewState.active) {
        startReview();
      }
    }
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

// ============ Keyboard Shortcuts Panel ============
function toggleShortcuts() {
  let panel = document.getElementById('shortcutsPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'shortcutsPanel';
    panel.className = 'shortcuts-panel';
    panel.innerHTML = `
      <div class="shortcuts-overlay" onclick="toggleShortcuts()"></div>
      <div class="shortcuts-modal">
        <h2>⌨️ 键盘快捷键</h2>
        <div class="shortcuts-grid">
          <div class="shortcut-item"><kbd>/</kbd><span>聚焦搜索框</span></div>
          <div class="shortcut-item"><kbd>Esc</kbd><span>关闭弹窗</span></div>
          <div class="shortcut-item"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd><kbd>5</kbd><kbd>6</kbd><span>切换分类</span></div>
          <div class="shortcut-item"><kbd>F</kbd><span>仅看收藏</span></div>
          <div class="shortcut-item"><kbd>S</kbd><span>开始刷题</span></div>
          <div class="shortcut-item"><kbd>R</kbd><span>开始复习</span></div>
          <div class="shortcut-item"><kbd>D</kbd><span>切换深色模式</span></div>
          <div class="shortcut-item"><kbd>?</kbd><span>显示快捷键面板</span></div>
          <div class="shortcut-item"><kbd>L</kbd><span>随机一题</span></div>
        </div>
        <button class="shortcuts-close" onclick="toggleShortcuts()">知道了</button>
      </div>`;
    document.body.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('show'));
  } else {
    panel.classList.toggle('show');
    if (!panel.classList.contains('show')) {
      setTimeout(() => { if (panel.parentNode) panel.remove(); }, 300);
    }
  }
}

// ============ Random Question ============
function randomQuestion() {
  const pool = State.filtered.length > 0 ? State.filtered : State.allQuestions;
  const q = pool[Math.floor(Math.random() * pool.length)];
  openModal(q.id);
}

// ============ Progress Export ============
function exportProgress() {
  const total = State.allQuestions.length;
  const viewed = State.viewed.size;
  const fav = State.favorites.size;
  const pct = (viewed / total * 100).toFixed(1);
  const ratings = JSON.parse(localStorage.getItem('ai-interview.ratings') || '{}');
  const rated = Object.keys(ratings).length;
  const avgRating = rated > 0 ? (Object.values(ratings).reduce((a,b) => a+b, 0) / rated).toFixed(1) : 'N/A';
  
  const reviewData = JSON.parse(localStorage.getItem('ai-interview.reviewItems') || '{}');
  const mastered = Object.values(reviewData).filter(r => 
    (r.algo === 'leitner' && r.box >= 4) ||
    (r.algo === 'ebbinghaus' && r.phase >= 5) ||
    (r.algo === 'sm2' && r.interval >= 21)
  ).length;
  
  const text = `📖 AI面试题库学习进度报告

📊 总览:
- 题库总量: ${total} 题
- 已学习: ${viewed} 题 (${pct}%)
- 已收藏: ${fav} 题
- 已评分: ${rated} 题 (平均 ${avgRating}⭐)
- 已掌握: ${mastered} 题

📅 生成时间: ${new Date().toLocaleString('zh-CN')}
🔗 题库地址: https://sunarthur86.github.io/ai-interview/`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('进度报告已复制到剪贴板！');
  }).catch(() => {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study-progress.txt';
    a.click();
  });
}

function showToast(msg) {
  let toast = document.getElementById('dynamicToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.className = 'dynamic-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ Modal Navigation & Actions ============
function copyAnswer(id) {
  const q = State.allQuestions.find(x => x.id === id);
  if (!q) return;
  const text = `Q: ${q.question}\n\nA: ${q.answer}\n\n来源: AI面试题库 (https://sunarthur86.github.io/ai-interview/)`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('答案已复制到剪贴板！');
  }).catch(() => {
    showToast('复制失败，请手动选择');
  });
}

function shareQuestion(id) {
  const q = State.allQuestions.find(x => x.id === id);
  if (!q) return;
  const text = `AI面试题: ${q.question}\n\n来源: https://sunarthur86.github.io/ai-interview/`;
  if (navigator.share) {
    navigator.share({ title: 'AI面试题', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('分享内容已复制！'));
  }
}

let _currentModalIndex = -1;
function navModal(dir) {
  if (_currentModalIndex < 0) return;
  const newIndex = _currentModalIndex + dir;
  if (newIndex >= 0 && newIndex < State.filtered.length) {
    closeModal();
    setTimeout(() => {
      openModal(State.filtered[newIndex].id);
      // Reset scroll after DOM update
      setTimeout(() => {
        const modalEl = document.getElementById('modal');
        if (modalEl) modalEl.scrollTop = 0;
      }, 50);
    }, 150);
  }
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
  // Study keyboard
  document.addEventListener('keydown', handleStudyKeyboard);
  document.addEventListener('keydown', handleReviewKeyboard);
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
