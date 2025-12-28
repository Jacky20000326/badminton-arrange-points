import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Flag to prevent multiple concurrent redirects
let isRedirecting = false;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器：添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器：處理錯誤
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // token 過期或無效，清除 sessionStorage
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');

      // 防止無限重定向
      if (!isRedirecting && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;

        // 如果不在登入頁，進行重定向
        if (!currentPath.includes('/login')) {
          isRedirecting = true;
          window.location.href = '/login';

          // 重置標誌（以防萬一）
          setTimeout(() => {
            isRedirecting = false;
          }, 1000);
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 認證 API
 */
export const authAPI = {
  // 用戶註冊
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    skillLevel: number;
  }) => apiClient.post('/api/auth/register', data),

  // 用戶登入
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),

  // 獲取當前用戶
  getCurrentUser: () => apiClient.get('/api/auth/me'),

  // 更新個人資料
  updateProfile: (data: {
    name?: string;
    phone?: string;
    skillLevel?: number;
  }) => apiClient.put('/api/auth/profile', data),
};

/**
 * 事件 API
 */
export const eventsAPI = {
  // 獲取活動列表
  listEvents: (page: number = 1, status?: string) =>
    apiClient.get('/api/events', { params: { page, status } }),

  // 獲取活動詳情
  getEventDetail: (eventId: string) =>
    apiClient.get(`/api/events/${eventId}`),

  // 創建活動
  createEvent: (data: {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    courtCount: number;
  }) => apiClient.post('/api/events', data),

  // 更新活動
  updateEvent: (eventId: string, data: {
    name?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    courtCount?: number;
    status?: string;
  }) => apiClient.put(`/api/events/${eventId}`, data),

  // 刪除活動
  deleteEvent: (eventId: string) =>
    apiClient.delete(`/api/events/${eventId}`),

  // 報名活動
  registerForEvent: (eventId: string, skillLevel: number) =>
    apiClient.post(`/api/events/${eventId}/register`, { skillLevel }),

  // 取消報名
  unregisterFromEvent: (eventId: string) =>
    apiClient.delete(`/api/events/${eventId}/register`),

  // 獲取報名列表
  getEventParticipants: (eventId: string) =>
    apiClient.get(`/api/events/${eventId}/registrations`),
};

/**
 * 比賽 API
 */
export const matchesAPI = {
  // 將在 Phase 5 實現
};

export default apiClient;
