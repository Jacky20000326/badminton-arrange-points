'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './page.module.css';

const SKILL_LEVELS = [
  { value: 1, label: '初學者 (1)' },
  { value: 2, label: '初級 (2)' },
  { value: 3, label: '初級中等 (3)' },
  { value: 4, label: '中級下 (4)' },
  { value: 5, label: '中級 (5)' },
  { value: 6, label: '中級上 (6)' },
  { value: 7, label: '中高級 (7)' },
  { value: 8, label: '高級 (8)' },
  { value: 9, label: '高級 (9)' },
  { value: 10, label: '職業 (10)' },
];

function ProfileContent() {
  const { user, updateProfile, loading: authLoading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skillLevel: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 初始化表單數據
    if (user) {
      setFormData({
        name: user.name || '',
        phone: '',
        skillLevel: 5,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'skillLevel' ? parseInt(value) : value,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(
        formData.name,
        formData.phone || undefined,
        formData.skillLevel
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← 返回儀表板
        </Link>
        <h1 className={styles.title}>個人資料</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {(error || authError) && (
              <div className={styles.errorAlert}>{error || authError}</div>
            )}

            {success && (
              <div className={styles.successAlert}>資料已成功更新！</div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                姓名
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                disabled={loading || authLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.label}>
                電話（選擇性）
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+886 9xxxxxxxx"
                className={styles.input}
                disabled={loading || authLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="skillLevel" className={styles.label}>
                羽球等級
              </label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                className={styles.select}
                disabled={loading || authLoading}
              >
                {SKILL_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>郵箱</label>
              <input
                type="email"
                value={user.email}
                className={styles.input}
                disabled
              />
              <p className={styles.hint}>郵箱無法修改</p>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || authLoading}
            >
              {loading || authLoading ? '更新中...' : '保存更改'}
            </button>
          </form>

          <div className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>帳戶信息</h2>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>角色</span>
              <span className={styles.infoValue}>
                {user.role === 'PLAYER'
                  ? '球友'
                  : user.role === 'ORGANIZER'
                    ? '團主'
                    : '管理員'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>註冊郵箱</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
