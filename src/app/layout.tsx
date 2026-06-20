import './globals.css';
import ClientBootstrap from '@/components/ClientBootstrap';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'AI 面试题库',
  description: '精选 AI / 大模型 / Agent 高频面试题，含费曼快学、第一性原理、遗忘曲线智能复习。',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0071e3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('ai-interview');var t='light';if(s){var j=JSON.parse(s);t=j.state&&j.state.theme||t;}else if(localStorage.getItem('ai-interview.theme')){t=JSON.parse(localStorage.getItem('ai-interview.theme'));}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ClientBootstrap>{children}</ClientBootstrap>
      </body>
    </html>
  );
}
