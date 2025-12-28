'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 如果用戶已登入，重定向到儀表板
    if (user && token) {
      router.push('/dashboard');
    }
  }, [user, token, router]);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          🏸 羽球排點系統
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
          智能化羽球比賽配對系統
        </p>

        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }}>
            歡迎使用羽球排點系統。登入或註冊以開始使用。
          </p>
          <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1rem' }}>
            Phase 1: 專案初始化 ✅ | Phase 2: 認證系統 🔄
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5568d3')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#667eea')}
          >
            登入
          </Link>
          <Link
            href="/register"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#764ba2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#653a8c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#764ba2')}
          >
            註冊
          </Link>
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>系統功能</h2>
          <ul style={{ textAlign: 'left', display: 'inline-block', color: '#666' }}>
            <li style={{ marginBottom: '0.5rem' }}>✅ 用戶註冊與登入</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ 個人資料與羽球等級管理</li>
            <li style={{ marginBottom: '0.5rem' }}>🔄 活動創建與管理</li>
            <li style={{ marginBottom: '0.5rem' }}>🔄 智能自動配對系統</li>
            <li>🔄 比賽狀態實時更新</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
