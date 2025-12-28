'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './page.module.css';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // ProtectedRoute ensures user is authenticated
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🏸 羽球排點系統</h1>
        <div className={styles.userSection}>
          <span className={styles.userName}>{user.name}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            登出
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <h2>歡迎，{user.name}！</h2>
          <p>郵箱：{user.email}</p>
          <p>角色：{user.role === 'PLAYER' ? '球友' : user.role === 'ORGANIZER' ? '團主' : '管理員'}</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>⚙️ 個人資料</h3>
            <p>檢視和編輯您的個人信息</p>
            <Link href="/profile" className={styles.cardLink}>
              前往 →
            </Link>
          </div>

          <div className={styles.card}>
            <h3>📅 活動</h3>
            <p>查看和參加羽球活動</p>
            <span className={styles.comingSoon}>即將推出</span>
          </div>

          <div className={styles.card}>
            <h3>🎯 比賽</h3>
            <p>查看比賽狀態和配對情況</p>
            <span className={styles.comingSoon}>即將推出</span>
          </div>

          <div className={styles.card}>
            <h3>📊 統計</h3>
            <p>查看您的比賽統計數據</p>
            <span className={styles.comingSoon}>即將推出</span>
          </div>
        </div>

        <section className={styles.section}>
          <h2>進度</h2>
          <ul className={styles.progressList}>
            <li>✅ Phase 1: 專案初始化</li>
            <li>✅ Phase 2: 認證系統（進行中）</li>
            <li>🔄 Phase 3: 活動管理</li>
            <li>🔄 Phase 4: 配對演算法</li>
            <li>🔄 Phase 5: 比賽管理</li>
            <li>🔄 Phase 6-8: 系統管理、測試與部署</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
