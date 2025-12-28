"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { eventsAPI } from "@/lib/api";
import { CreateEventInput } from "@/types/event";
import EventForm from "@/components/EventForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./page.module.css";

function CreateEventContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 檢查權限
  if (user && !["ORGANIZER", "ADMIN"].includes(user.role)) {
    return (
      <div className={styles.container}>
        <div className={styles.errorAlert}>只有團主和管理員才能創建活動</div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateEventInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.createEvent(data);
      const eventId = response.data.data.id;
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      const message = err.response?.data?.error || "創建活動失敗";
      setError(message);
      console.error("Failed to create event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>創建新活動</h1>
        <p className={styles.subtitle}>填寫以下信息來創建一個新的羽球活動</p>

        <EventForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <CreateEventContent />
    </ProtectedRoute>
  );
}
