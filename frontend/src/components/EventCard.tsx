'use client';

import React from 'react';
import Link from 'next/link';
import styles from './EventCard.module.css';
import { Event, EventStatus } from '@/types/event';

interface EventCardProps {
  event: Event;
  participantCount?: number;
  isRegistered?: boolean;
  onRegister?: (eventId: string, skillLevel: number) => void;
}

export default function EventCard({
  event,
  participantCount = 0,
  isRegistered = false,
  onRegister,
}: EventCardProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const formattedStartDate = startDate.toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = (status: EventStatus) => {
    const statusMap: Record<EventStatus, { label: string; color: string }> = {
      draft: { label: '草稿', color: '#999' },
      active: { label: '進行中', color: '#4CAF50' },
      completed: { label: '已完成', color: '#2196F3' },
      cancelled: { label: '已取消', color: '#f44336' },
    };

    return statusMap[status] || { label: '未知', color: '#999' };
  };

  const statusBadge = getStatusBadge(event.status);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{event.name}</h3>
        <span
          className={styles.status}
          style={{ backgroundColor: statusBadge.color }}
        >
          {statusBadge.label}
        </span>
      </div>

      {event.description && (
        <p className={styles.description}>{event.description}</p>
      )}

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.label}>📅 時間</span>
          <span className={styles.value}>{formattedStartDate}</span>
        </div>

        <div className={styles.detail}>
          <span className={styles.label}>🏸 場地</span>
          <span className={styles.value}>{event.courtCount} 個</span>
        </div>

        <div className={styles.detail}>
          <span className={styles.label}>👥 報名</span>
          <span className={styles.value}>{participantCount} 人</span>
        </div>
      </div>

      <div className={styles.footer}>
        <Link href={`/events/${event.id}`} className={styles.detailLink}>
          查看詳情
        </Link>
        {isRegistered && (
          <span className={styles.registered}>✓ 已報名</span>
        )}
      </div>
    </div>
  );
}
