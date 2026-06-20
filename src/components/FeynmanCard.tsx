import type { Feynman } from '@/lib/types';

export default function FeynmanCard({ feynman }: { feynman: Feynman }) {
  if (!feynman || (!feynman.essence && !feynman.analogy && !feynman.key_points?.length)) return null;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--success)',
        borderRadius: '12px',
        padding: '14px 16px',
        margin: '12px 0',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
        🎓 费曼快学
      </div>
      {feynman.essence && (
        <div style={{ marginBottom: '6px', fontSize: '14px' }}>
          🎯 <strong>一句话本质：</strong>
          {feynman.essence}
        </div>
      )}
      {feynman.analogy && (
        <div style={{ marginBottom: '6px', fontSize: '14px' }}>
          🧒 <strong>大白话：</strong>
          {feynman.analogy}
        </div>
      )}
      {feynman.key_points && feynman.key_points.length > 0 && (
        <div style={{ fontSize: '14px' }}>
          💡 <strong>记忆要点：</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
            {feynman.key_points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
