/**
 * AI Interview — Project Configuration
 * 
 * This file defines ALL project-specific settings for the AI interview app.
 * The framework JS (js/app.js, js/study.js, js/forgetting.js) reads from this config.
 * Change framework code in interview-framework/ and run sync.sh to propagate.
 */
'use strict';

const APP_CONFIG = {
  // ===== Branding =====
  appName: 'AI 面试题库',
  appNameShort: 'AI面试题',
  appIcon: '🧠',
  appVersion: '3.6',
  appDescription: '精选 AI 面试题，涵盖 LLM核心、AI Agent、AI Harness、FDE、工程化实战、AI 基础七大方向，由浅入深 L1-L5 分级，支持按难度排序、智能搜索、遗忘曲线复习。',
  keywords: 'AI面试题,大模型面试,Agent面试,RAG,LLM,人工智能,深度学习,Transformer,LoRA,DPO,PPO,DeepSeek,vLLM,FlashAttention',

  // ===== Storage =====
  storagePrefix: 'ai-interview',

  // ===== URLs =====
  githubUrl: 'https://sunarthur86.github.io/ai-interview/',

  // ===== Theme =====
  themeColor: '#0071e3',
  bgColor: '#f5f5f7',

  // ===== Categories =====
  categories: {
    'all':          { label: '全部', icon: '📚', color: '#0071e3', files: null },
    'llm-core':     { label: 'LLM 核心', icon: '🔥', color: '#ff3b30', files: ['data/llm-100.json', 'data/llm-notes.json', 'data/new-llm-core.json'] },
    'ai-agent':     { label: 'AI Agent', icon: '🤖', color: '#af52de', files: ['data/ai-agent.json', 'data/agent-concept.json', 'data/agent-framework.json', 'data/agent-multi.json', 'data/new-agent-arch.json', 'data/agent-rag.json', 'data/agent-tools.json', 'data/agent-memory.json', 'data/agent-prompt.json', 'data/agent-llm.json', 'data/new-agent-skill.json'] },
    'ai-harness':   { label: 'AI Harness', icon: '🏗️', color: '#5856d6', files: ['data/ai-harness.json', 'data/agent-eng.json'] },
    'fde':          { label: 'FDE', icon: '🚀', color: '#00c7be', files: ['data/fde.json'] },
    'eng-practice': { label: '工程化实战', icon: '⚙️', color: '#ff9500', files: ['data/agent-interview-qa.json', 'data/new-eng-practice.json'] },
    'ai-basics':    { label: 'AI 基础', icon: '🧠', color: '#34c759', files: ['data/ai-basics.json', 'data/new-ai-basics.json'] },
  },

  // ===== Subcategory Group Mapping =====
  subcatGroups: {
    // LLM 核心
    'Transformer': ['Transformer架构', '注意力机制', '位置编码', '归一化', '激活函数', '模型结构', '模型架构'],
    '训练与微调': ['训练与微调', '训练优化', 'LoRA与微调', '参数高效微调', '微调策略', 'SFT与RLHF', '对齐技术', '对齐训练', '训练理论', '分布式训练'],
    'LLM前沿': ['LLM前沿', 'DeepSeek-R1', '强化学习', 'Tokenizer', '多模态', 'Text2SQL', 'LLM推荐', '实验管理'],
    // AI Agent
    'AI Agent': ['Agent基础概念', 'Agent核心框架', 'Agent架构', 'Agent稳定性', 'Agent评估', '工具调用', 'Function Calling', '工具使用', '记忆系统', 'Agent记忆', '规划与推理', '多智能体', '多智能体系统', '多Agent系统', 'Prompt工程', 'Prompt Engineering'],
    'RAG': ['RAG技术', 'RAG进阶', 'RAG与向量检索', '向量检索'],
    // AI Harness
    'AI Harness': ['推理优化', '推理与部署', '生产工程化', '生产化部署', '模型服务', '模型部署', '部署架构', '工程化', '工程化实践', '工程实践', 'Agent工程化', 'Agent框架', 'LLM框架', 'RAG工程化', '向量数据库', '可观测性', '评估与安全', '评估', '评估指标', '评测与质量', 'Agent安全', '安全'],
    // AI 基础
    '大模型基础': ['大模型基础', '大模型架构', '大模型原理', '大模型综合', '大模型应用', '基础知识', '预训练模型', '表示学习', '长上下文'],
    // FDE
    'FDE': ['FDE基础概念', 'FDE工作实践', 'AI解决方案设计', 'AI部署实施', '数据安全与合规'],
    // 工程化实战
    '面试实战': ['企业面试问答', '手撕代码', 'AI编程', '文档处理'],
  },

  // ===== About Text =====
  aboutText: 'AI 面试题库 v3.6\n784 道精选题目 · 遗忘曲线复习系统\n覆盖 LLM核心 · AI Agent · AI Harness · 工程化实战 · AI基础',
  aboutTarget: '对标阿里 P7 / 字节 2-2 / 腾讯 T9',
};
