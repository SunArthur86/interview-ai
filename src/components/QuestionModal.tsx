'use client';

import { useEffect, useCallback } from 'react';
import type { Question } from '@/lib/types';
import { APP_CONFIG } from '@/lib/config';
import { useStore } from '@/lib/store';
import QuestionContent from './QuestionContent';
import { showToast } from './Toast';

interface Props {
  q: Question;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onFollowUp: (text: string) => void;
}

export default function QuestionModal({ q, index, total, onPrev, onNext, onClose, onFollowUp }: Props) {
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const markViewed = useStore((s) => s.markViewed);
  const isFav = favorites.includes(q.id);
  const basePath = process.env.NODE_ENV === 'production' ? '/ai-interview' : '';

  useEffect(() => {
    markViewed(q.id);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [q.id, markViewed]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleCopy = () => {
    const text = `Q: ${q.question}\n\nA: ${q.answer.replace(/[#*`>]/g, '').slice(0, 2000)}\n\n来源: ${APP_CONFIG.githubUrl}`;
    navigator.clipboard?.writeText(text).then(() => showToast('答案已复制到剪贴板'));
  };

  const handleShare = () => {
    const url = `${window.location.origin}${basePath}/question/${q.id}/`;
    const feynmanEssence = q.feynman?.essence ? `\n\n${q.feynman.essence.slice(0, 80)}` : '';
    const shareText = `${q.question}${feynmanEssence}\n\n${url}`;
    if (navigator.share) {
      navigator.share({ title: q.question, text: shareText, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).then(() => showToast('分享链接已复制'));
    }
  };

  const handleReport = () => {
    const title = `[题目纠错] ${q.id} ${q.question.slice(0, 30)}`;
    const body = `**题目ID**: ${q.id}\n**题目**: ${q.question}\n**难度**: ${q.difficulty}\n\n**问题描述/建议**:\n\n`;
    window.open(`${APP_CONFIG.repoUrl}/issues/new?title=${encodeURIComponent(title)}&labels=${encodeURIComponent('题目纠错')}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingTop: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg)', width: '100%', maxWidth: '760px', height: 'calc(100% - 20px)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, flex: 1, paddingRight: '12px' }}>{q.question}</h2>
          <button onClick={onClose} aria-label="关闭" style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-tertiary)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <QuestionContent q={q} onFollowUp={onFollowUp} />
        </div>

        {/* footer actions */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => toggleFavorite(q.id)} style={btnStyle(isFav)}>{isFav ? '♥ 已收藏' : '♡ 收藏'}</button>
          <button onClick={handleCopy} style={btnStyle(false)}>📋 复制</button>
          <button onClick={handleShare} style={btnStyle(false)}>🔗 分享</button>
          <button onClick={handleReport} style={btnStyle(false)}>🐛 纠错</button>
          <div style={{ flex: 1 }} />
          <button onClick={onPrev} disabled={index <= 0} style={navBtnStyle(index <= 0)}>← 上一题</button>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '0 6px' }}>{index + 1} / {total}</span>
          <button onClick={onNext} disabled={index >= total - 1} style={navBtnStyle(index >= total - 1)}>下一题 →</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--primary)' : 'var(--bg-soft)',
    color: active ? '#fff' : 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
  };
}
function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'var(--bg-soft)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
