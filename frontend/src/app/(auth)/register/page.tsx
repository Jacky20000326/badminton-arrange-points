'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    skillLevel: 5,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    if (formData.phone && formData.phone.length > 20) {
      errors.phone = 'Phone must be less than 20 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'skillLevel' ? parseInt(value) : value,
    }));

    // 清除該字段的驗證錯誤
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // 清除 API 錯誤
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.skillLevel,
        formData.phone || undefined
      );
      router.push('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🏸 羽球排點系統</h1>
        <h2 className={styles.subtitle}>建立帳戶</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              郵箱 <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
              disabled={loading}
            />
            {validationErrors.email && (
              <span className={styles.errorText}>{validationErrors.email}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              姓名 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="你的姓名"
              className={`${styles.input} ${validationErrors.name ? styles.inputError : ''}`}
              disabled={loading}
            />
            {validationErrors.name && (
              <span className={styles.errorText}>{validationErrors.name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              密碼 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="至少 6 個字符"
              className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
              disabled={loading}
            />
            {validationErrors.password && (
              <span className={styles.errorText}>{validationErrors.password}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              確認密碼 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次輸入密碼"
              className={`${styles.input} ${
                validationErrors.confirmPassword ? styles.inputError : ''
              }`}
              disabled={loading}
            />
            {validationErrors.confirmPassword && (
              <span className={styles.errorText}>{validationErrors.confirmPassword}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="skillLevel" className={styles.label}>
              羽球等級 <span className={styles.required}>*</span>
            </label>
            <select
              id="skillLevel"
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
              className={styles.select}
              disabled={loading}
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <p className={styles.hint}>
              根據台灣羽球推廣協會的分級標準選擇
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              電話 (選擇性)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+886 9xxxxxxxx"
              className={`${styles.input} ${validationErrors.phone ? styles.inputError : ''}`}
              disabled={loading}
            />
            {validationErrors.phone && (
              <span className={styles.errorText}>{validationErrors.phone}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '註冊中...' : '建立帳戶'}
          </button>
        </form>

        <p className={styles.footer}>
          已有帳戶？
          <Link href="/login" className={styles.link}>
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
