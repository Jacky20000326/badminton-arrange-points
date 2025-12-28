'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { eventsAPI } from '@/lib/api';
import { Event, EventListResponse, EventStatus } from '@/types/event';
import EventCard from '@/components/EventCard';
import Pagination from '@/components/Pagination';
import ProtectedRoute from '@/components/ProtectedRoute';
import styles from './page.module.css';

function EventsListContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');

  const fetchEvents = async (page: number, status?: EventStatus) => {
    setLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.listEvents(page, status);
      const data: EventListResponse = response.data.data;
      setEvents(data.events);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      const message = err.response?.data?.error || '無法加載活動列表';
      setError(message);
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, statusFilter || undefined);
  }, [statusFilter]);

  const handlePageChange = (page: number) => {
    fetchEvents(page, statusFilter || undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusFilter = (status: EventStatus | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🏸 活動列表</h1>
        {user?.role === 'ORGANIZER' || user?.role === 'ADMIN' ? (
          <button
            className={styles.createButton}
            onClick={() => router.push('/events/create')}
          >
            + 創建活動
          </button>
        ) : null}
      </header>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>篩選狀態：</label>
          <div className={styles.filterButtons}>
            {(['', 'draft', 'active', 'completed', 'cancelled'] as const).map(
              (status) => (
                <button
                  key={status}
                  className={`${styles.filterButton} ${
                    statusFilter === status ? styles.active : ''
                  }`}
                  onClick={() => handleStatusFilter(status)}
                >
                  {status === ''
                    ? '全部'
                    : status === 'draft'
                      ? '草稿'
                      : status === 'active'
                        ? '進行中'
                        : status === 'completed'
                          ? '已完成'
                          : '已取消'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>加載中...</div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>
          <p>目前沒有活動</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                participantCount={0}
                isRegistered={false}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function EventsListPage() {
  return (
    <ProtectedRoute>
      <EventsListContent />
    </ProtectedRoute>
  );
}
