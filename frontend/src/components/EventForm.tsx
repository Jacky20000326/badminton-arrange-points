'use client';

import React, { useState, useEffect } from 'react';
import styles from './EventForm.module.css';
import { Event, CreateEventInput } from '@/types/event';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function EventForm({
  event,
  onSubmit,
  isLoading = false,
  error = null,
}: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    courtCount: 1,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      // Convert ISO string to datetime-local format
      const startDateTime = new Date(event.startTime);
      const endDateTime = new Date(event.endTime);

      setFormData({
        name: event.name,
        description: event.description || '',
        startTime: startDateTime.toISOString().slice(0, 16),
        endTime: endDateTime.toISOString().slice(0, 16),
        courtCount: event.courtCount,
      });
    }
  }, [event]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '活動名稱不能為空';
    } else if (formData.name.length > 100) {
      errors.name = '活動名稱不能超過 100 個字符';
    }

    if (!formData.startTime) {
      errors.startTime = '開始時間不能為空';
    }

    if (!formData.endTime) {
      errors.endTime = '結束時間不能為空';
    }

    if (formData.startTime && formData.endTime) {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (startDate >= endDate) {
        errors.endTime = '結束時間必須晚於開始時間';
      }

      // Check if start time is in the future
      if (startDate < new Date()) {
        errors.startTime = '開始時間必須在未來';
      }
    }

    if (!formData.courtCount || formData.courtCount < 1) {
      errors.courtCount = '場地數量必須至少為 1';
    } else if (formData.courtCount > 100) {
      errors.courtCount = '場地數量不能超過 100';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = '活動描述不能超過 500 個字符';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'courtCount') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field when user starts editing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        // Convert to ISO string for API
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          活動名稱 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="例如：週三羽球活動"
          className={`${styles.input} ${validationErrors.name ? styles.inputError : ''}`}
          disabled={isSubmitting || isLoading}
        />
        {validationErrors.name && (
          <span className={styles.errorMessage}>{validationErrors.name}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          活動描述
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="活動的詳細描述（可選）"
          rows={4}
          className={`${styles.textarea} ${validationErrors.description ? styles.inputError : ''}`}
          disabled={isSubmitting || isLoading}
        />
        <div className={styles.charCount}>
          {(formData.description ?? '').length} / 500
        </div>
        {validationErrors.description && (
          <span className={styles.errorMessage}>{validationErrors.description}</span>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="startTime" className={styles.label}>
            開始時間 <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={`${styles.input} ${validationErrors.startTime ? styles.inputError : ''}`}
            disabled={isSubmitting || isLoading}
          />
          {validationErrors.startTime && (
            <span className={styles.errorMessage}>{validationErrors.startTime}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="endTime" className={styles.label}>
            結束時間 <span className={styles.required}>*</span>
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={`${styles.input} ${validationErrors.endTime ? styles.inputError : ''}`}
            disabled={isSubmitting || isLoading}
          />
          {validationErrors.endTime && (
            <span className={styles.errorMessage}>{validationErrors.endTime}</span>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="courtCount" className={styles.label}>
          場地數量 <span className={styles.required}>*</span>
        </label>
        <input
          type="number"
          id="courtCount"
          name="courtCount"
          value={formData.courtCount}
          onChange={handleChange}
          min="1"
          max="100"
          className={`${styles.input} ${validationErrors.courtCount ? styles.inputError : ''}`}
          disabled={isSubmitting || isLoading}
        />
        {validationErrors.courtCount && (
          <span className={styles.errorMessage}>{validationErrors.courtCount}</span>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting || isLoading}
      >
        {isSubmitting || isLoading ? '提交中...' : event ? '更新活動' : '創建活動'}
      </button>
    </form>
  );
}
