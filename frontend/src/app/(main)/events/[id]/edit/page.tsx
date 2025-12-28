"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { eventsAPI } from "@/lib/api";
import { Event, CreateEventInput } from "@/types/event";
import EventForm from "@/components/EventForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./page.module.css";

function EditEventContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchEventDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await eventsAPI.getEventDetail(eventId);
        const eventData = response.data.data;
        setEvent(eventData);

        // Check permission
        if (
          user &&
          eventData.organizerId !== user.id &&
          user.role !== "ADMIN"
        ) {
          setError("你沒有權限編輯此活動");
        }
      } catch (err: any) {
        const message = err.response?.data?.error || "無法加載活動詳情";
        setError(message);
        console.error("Failed to fetch event detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId, user]);

  const handleSubmit = async (data: CreateEventInput) => {
    setIsUpdating(true);
    setError(null);

    try {
      await eventsAPI.updateEvent(eventId, {
        name: data.name,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        courtCount: data.courtCount,
      });

      router.push(`/events/${eventId}`);
    } catch (err: any) {
      const message = err.response?.data?.error || "更新活動失敗";
      setError(message);
      console.error("Failed to update event:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加載中...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className={styles.container}>
        <div className={styles.errorAlert}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.back()}>
        ← 返回
      </button>

      <div className={styles.card}>
        <h1 className={styles.title}>編輯活動</h1>
        <p className={styles.subtitle}>修改活動信息</p>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <EventForm
          event={event}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <ProtectedRoute>
      <EditEventContent />
    </ProtectedRoute>
  );
}
