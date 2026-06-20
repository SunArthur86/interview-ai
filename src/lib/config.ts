import type { Algorithm } from './types';

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
}

export const APP_CONFIG = {
  appName: 'AI 面试题库',
  appNameShort: 'AI面试题',
  appIcon: '🧠',
  appVersion: '4.0',
  storagePrefix: 'ai-interview',
  githubUrl: 'https://sunarthur86.github.io/ai-interview/',
  repoUrl: 'https://github.com/SunArthur86/ai-interview',
  themeColor: '#0071e3',
  categories: {
    'all': { label: '全部', icon: '📚', color: '#0071e3' },
    'llm-core': { label: 'LLM 核心', icon: '🔥', color: '#ff3b30' },
    'ai-agent': { label: 'AI Agent', icon: '🤖', color: '#af52de' },
    'ai-harness': { label: 'AI Harness', icon: '🏗️', color: '#5856d6' },
    'fde': { label: 'FDE', icon: '🚀', color: '#00c7be' },
    'eng-practice': { label: '工程化实战', icon: '⚙️', color: '#ff9500' },
    'ai-basics': { label: 'AI 基础', icon: '🧠', color: '#34c759' },
    'ai-scenario': { label: 'AI 场景设计', icon: '🎯', color: '#e74c3c' },
  } as Record<string, CategoryConfig>,
  subcatGroups: {
    'Transformer': ['Transformer架构', '注意力机制', '位置编码', '归一化', '激活函数', '模型结构', '模型架构'],
    '训练与微调': ['训练与微调', '训练优化', 'LoRA与微调', '参数高效微调', '微调策略', 'SFT与RLHF', '对齐技术', '对齐训练', '训练理论', '分布式训练'],
    'LLM前沿': ['LLM前沿', 'DeepSeek-R1', '强化学习', 'Tokenizer', '多模态', 'Text2SQL', 'LLM推荐', '实验管理', 'LLM进阶'],
    'AI Agent': ['Agent基础概念', 'Agent核心框架', 'Agent架构', 'Agent稳定性', 'Agent评估', '工具调用', 'Function Calling', '工具使用', '记忆系统', 'Agent记忆', '规划与推理', '多智能体', '多智能体系统', '多Agent系统', 'Prompt工程', 'Prompt Engineering'],
    'RAG': ['RAG技术', 'RAG进阶', 'RAG与向量检索', '向量检索', '高级RAG'],
    'AI Harness': ['推理优化', '推理与部署', '生产工程化', '生产化部署', '模型服务', '模型部署', '部署架构', '工程化', '工程化实践', '工程实践', 'Agent工程化', 'Agent框架', 'LLM框架', 'RAG工程化', '向量数据库', '可观测性', '评估与安全', '评估', '评估指标', '评测与质量', 'Agent安全', '安全'],
    '大模型基础': ['大模型基础', '大模型架构', '大模型原理', '大模型综合', '大模型应用', '基础知识', '预训练模型', '表示学习', '长上下文'],
    'AI场景-RAG': ['RAG系统设计'],
    'AI场景-Agent': ['AI Agent系统设计'],
    'AI场景-对话': ['AI对话系统设计'],
    'AI场景-推理部署': ['LLM推理与部署'],
    'AI场景-安全治理': ['AI安全与治理'],
    'AI场景-评测监控': ['AI评测与监控'],
    'AI场景-多模态': ['多模态AI系统'],
    'AI场景-推荐搜索': ['AI推荐与搜索'],
    'AI场景-代码助手': ['AI代码助手'],
    'AI场景-特殊应用': ['AI特殊场景'],
    'FDE': ['FDE基础概念', 'FDE工作实践', 'AI解决方案设计', 'AI部署实施', '数据安全与合规'],
    '面试实战': ['企业面试问答', '手撕代码', 'AI编程', '文档处理'],
  } as Record<string, string[]>,
  aboutText: '精选 AI / 大模型 / Agent 高频面试题，含费曼快学、第一性原理、遗忘曲线智能复习。每题一个 markdown，构建期读取渲染。',
} as const;

export const SUBCAT_REVERSE: Record<string, string> = {};
Object.entries(APP_CONFIG.subcatGroups).forEach(([g, subs]) => {
  subs.forEach((s) => {
    SUBCAT_REVERSE[s] = g;
  });
});

export function getSubcatGroup(sub: string | undefined): string {
  return (sub && SUBCAT_REVERSE[sub]) || '其他';
}

export const ALGO_LABELS: Record<Algorithm, string> = {
  sm2: 'SM-2 智能间隔',
  leitner: 'Leitner 卡盒',
  ebbinghaus: '艾宾浩斯曲线',
};
