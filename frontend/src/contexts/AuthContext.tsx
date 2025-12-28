'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, skillLevel: number, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name?: string, phone?: string, skillLevel?: number) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  initialized: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, loading: true, initialized: false };

    case 'INIT_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        initialized: true,
        error: null,
      };

    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'LOGOUT':
      return { ...state, user: null, token: null };

    case 'UPDATE_PROFILE_SUCCESS':
      return { ...state, user: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化：從 sessionStorage 加載保存的 token 和用戶，並驗證有效性
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'INIT_START' });

      try {
        const token = sessionStorage.getItem('authToken');
        const userStr = sessionStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);

            // 驗證 token 有效性（可選，調用 API）
            // 可以取消註解以進行 token 驗證
            // const response = await authAPI.getMe();
            // const validUser = response.data.data;

            dispatch({
              type: 'INIT_SUCCESS',
              payload: { user, token },
            });
          } catch (error) {
            // Token 或用戶信息無效，清除
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            dispatch({ type: 'INIT_SUCCESS', payload: { user: null, token: null } });
          }
        } else {
          // 沒有保存的 token，初始化為未認證狀態
          dispatch({ type: 'INIT_SUCCESS', payload: { user: null, token: null } });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'INIT_SUCCESS', payload: { user: null, token: null } });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authAPI.login({ email, password });
      const { data } = response.data;

      // 保存到 sessionStorage
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('user', JSON.stringify(data));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
          },
          token: data.token,
        },
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMsg });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, skillLevel: number, phone?: string) => {
      dispatch({ type: 'REGISTER_START' });

      try {
        const response = await authAPI.register({
          email,
          password,
          name,
          skillLevel,
          phone,
        });
        const { data } = response.data;

        // 保存到 sessionStorage
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('user', JSON.stringify(data));

        dispatch({
          type: 'REGISTER_SUCCESS',
          payload: {
            user: {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role,
            },
            token: data.token,
          },
        });
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Registration failed';
        dispatch({ type: 'REGISTER_ERROR', payload: errorMsg });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (name?: string, phone?: string, skillLevel?: number) => {
    try {
      const response = await authAPI.updateProfile({ name, phone, skillLevel });
      const { data } = response.data;

      const updatedUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };

      // 更新 sessionStorage
      sessionStorage.setItem('user', JSON.stringify(data));
      dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: updatedUser });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Update profile failed';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        initialized: state.initialized,
        error: state.error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
