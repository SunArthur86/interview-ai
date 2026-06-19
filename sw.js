// AI Interview — Service Worker
const CACHE_NAME = 'ai-interview-v17';
const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './css/style.css',
  './css/study.css',
  './css/forgetting.css',
  './js/app.js',
  './js/study.js',
  './js/forgetting.js',
  './manifest.json',
  // All 35 data files
  './data/llm-100.json',
  './data/llm-notes.json',
  './data/new-llm-core.json',
  './data/agent-concept.json',
  './data/agent-framework.json',
  './data/agent-multi.json',
  './data/agent-rag.json',
  './data/agent-tools.json',
  './data/agent-memory.json',
  './data/agent-prompt.json',
  './data/agent-llm.json',
  './data/agent-eng.json',
  './data/agent-interview-qa.json',
  './data/ai-agent.json',
  './data/ai-harness.json',
  './data/ai-basics.json',
  './data/ai-scenario.json',
  './data/fde.json',
  './data/new-agent-arch.json',
  './data/new-agent-skill.json',
  './data/new-eng-practice.json',
  './data/new-ai-basics.json',
  './data/supp-llm-transformer.json',
  './data/supp-llm-training.json',
  './data/supp-llm-frontier.json',
  './data/supp-llm-advanced.json',
  './data/supp-finetuning.json',
  './data/supp-agent-arch.json',
  './data/supp-agent-rag.json',
  './data/supp-agent-frameworks.json',
  './data/supp-advanced-rag.json',
  './data/supp-harness-inference.json',
  './data/supp-eng-practice.json',
  './data/supp-ai-basics.json',
  './data/supp-multimodal.json',
  './data/xhs-ai-infra.json',
  // SVG concept diagrams (22)
  './images/svg_attention.svg',
  './images/svg_kvcache.svg',
  './images/svg_lora.svg',
  './images/svg_moe.svg',
  './images/svg_quantization.svg',
  './images/svg_rag.svg',
  './images/svg_react.svg',
  './images/svg_rlhf_dpo.svg',
  './images/svg_training.svg',
  './images/svg_transformer.svg',
  './images/svg_rope.svg',
  './images/svg_agent.svg',
  './images/svg_pd_separation.svg',
  './images/svg_clm_mlm.svg',
  './images/svg_bpe.svg',
  './images/svg_speculative.svg',
  './images/svg_beam_search.svg',
  './images/svg_transformer_blocks.svg',
  './images/svg_normalization.svg',
  './images/svg_embedding_training.svg',
  './images/svg_gradient_descent.svg',
  './images/svg_rag_pipeline.svg',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static, stale-while-revalidate for data
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;
  // Data files — stale-while-revalidate
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
  // Static — cache-first
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).catch(() => caches.match('./index.html'))
    )
  );
});
