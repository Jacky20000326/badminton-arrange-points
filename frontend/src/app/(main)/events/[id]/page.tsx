'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { eventsAPI } from '@/lib/api';
import { EventDetailResponse } from '@/types/event';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './page.module.css';

function EventDetailContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [skillLevel, setSkillLevel] = useState(5);

  useEffect(() => {
    const fetchEventDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await eventsAPI.getEventDetail(eventId);
        const eventData: EventDetailResponse = response.data.data;
        setEvent(eventData);

        // 檢查用戶是否已報名
        if (user) {
          const registered = eventData.registrations.some(
            (reg) => reg.userId === user.id && reg.status === 'registered'
          );
          setIsRegistered(registered);

          // 如果已報名，設置當前的技能等級
          const userReg = eventData.registrations.find(
            (reg) => reg.userId === user.id && reg.status === 'registered'
          );
          if (userReg) {
            setSkillLevel(userReg.skillLevel);
          }
        }
      } catch (err: any) {
        const message = err.response?.data?.error || '無法加載活動詳情';
        setError(message);
        console.error('Failed to fetch event detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      await eventsAPI.registerForEvent(eventId, skillLevel);
      setIsRegistered(true);

      // 重新加載活動信息
      const response = await eventsAPI.getEventDetail(eventId);
      setEvent(response.data.data);
    } catch (err: any) {
      const message = err.response?.data?.error || '報名失敗';
      setError(message);
      console.error('Failed to register:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    setRegistering(true);
    setError(null);

    try {
      await eventsAPI.unregisterFromEvent(eventId);
      setIsRegistered(false);

      // 重新加載活動信息
      const response = await eventsAPI.getEventDetail(eventId);
      setEvent(response.data.data);
    } catch (err: any) {
      const message = err.response?.data?.error || '取消報名失敗';
      setError(message);
      console.error('Failed to unregister:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleEdit = () => {
    router.push(`/events/${eventId}/edit`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加載中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.errorAlert}>{error || '活動不存在'}</div>
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizerId;
  const canEdit = isOrganizer || user?.role === 'ADMIN';
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const hasSkillStats = event.registrations && event.registrations.length > 0;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.back()}>
        ← 返回列表
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{event.name}</h1>
            <p className={styles.organizer}>
              主辦人：{event.organizer.name} ({event.organizer.email})
            </p>
          </div>
          <div className={styles.statusBadge} data-status={event.status}>
            {event.status === 'draft'
              ? '草稿'
              : event.status === 'active'
                ? '進行中'
                : event.status === 'completed'
                  ? '已完成'
                  : '已取消'}
          </div>
        </div>

        {event.description && (
          <div className={styles.description}>{event.description}</div>
        )}

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.label}>開始時間</span>
            <span className={styles.value}>
              {startDate.toLocaleDateString('zh-TW')} {startDate.toLocaleTimeString('zh-TW')}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>結束時間</span>
            <span className={styles.value}>
              {endDate.toLocaleDateString('zh-TW')} {endDate.toLocaleTimeString('zh-TW')}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>場地數量</span>
            <span className={styles.value}>{event.courtCount} 個</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>已報名人數</span>
            <span className={styles.value}>{event.registrationCount} 人</span>
          </div>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <div className={styles.actions}>
          {!isRegistered ? (
            <>
              <div className={styles.skillLevelInput}>
                <label htmlFor="skillLevel">你的羽球等級（1-10）</label>
                <input
                  type="range"
                  id="skillLevel"
                  min="1"
                  max="10"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                  disabled={registering}
                />
                <span className={styles.skillValue}>{skillLevel}</span>
              </div>
              <button
                className={styles.registerButton}
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? '報名中...' : '報名活動'}
              </button>
            </>
          ) : (
            <button
              className={styles.unregisterButton}
              onClick={handleUnregister}
              disabled={registering}
            >
              {registering ? '取消中...' : '取消報名'}
            </button>
          )}

          {canEdit && (
            <button className={styles.editButton} onClick={handleEdit}>
              編輯活動
            </button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>參與者列表</h2>
          {event.registrations.length === 0 ? (
            <p className={styles.empty}>暫無報名者</p>
          ) : (
            <div className={styles.participantsList}>
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>總人數</span>
                  <span className={styles.statValue}>{event.registrations.length}</span>
                </div>
                {hasSkillStats && (
                  <>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>平均等級</span>
                      <span className={styles.statValue}>
                        {(
                          event.registrations.reduce((sum, r) => sum + r.skillLevel, 0) /
                          event.registrations.length
                        ).toFixed(1)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>郵箱</th>
                    <th>等級</th>
                    <th>報名時間</th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td>{reg.user?.name || 'N/A'}</td>
                      <td>{reg.user?.email || 'N/A'}</td>
                      <td>{reg.skillLevel}</td>
                      <td>
                        {new Date(reg.registeredAt).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}
