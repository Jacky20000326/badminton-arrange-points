export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  skillLevel: number; // 1-10
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
  token: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
}

export interface JWTPayload extends UserPayload {
  iat: number;
  exp: number;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  skillLevel?: number;
}
