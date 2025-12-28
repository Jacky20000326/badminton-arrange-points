import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import logger from "../utils/logger";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  JWTPayload,
  UpdateProfileRequest,
} from "../types/auth";
import {
  validateEmail,
  validatePassword,
  validateSkillLevel,
  validateName,
  validatePhone,
  ValidationError,
} from "../utils/validation";

let JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Validate JWT_SECRET is configured
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production"
    );
  }
  logger.warn(
    "JWT_SECRET not configured, using development default (UNSAFE for production)"
  );
  JWT_SECRET = "dev-secret-key-change-in-production";
}

export class AuthService {
  /**
   * 用戶註冊
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    // 驗證輸入
    if (!validateEmail(data.email)) {
      throw new ValidationError("email", "Invalid email format");
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new ValidationError(
        "password",
        passwordValidation.message || "Invalid password"
      );
    }

    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      throw new ValidationError(
        "name",
        nameValidation.message || "Invalid name"
      );
    }

    const skillValidation = validateSkillLevel(data.skillLevel);
    if (!skillValidation.valid) {
      throw new ValidationError(
        "skillLevel",
        skillValidation.message || "Invalid skill level"
      );
    }

    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) {
      throw new ValidationError(
        "phone",
        phoneValidation.message || "Invalid phone"
      );
    }

    // 檢查郵箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ValidationError("email", "Email already registered");
    }

    try {
      // 密碼加密
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      // 建立用戶
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: "PLAYER",
          playerProfile: {
            create: {
              skillLevel: data.skillLevel,
            },
          },
        },
        include: {
          playerProfile: true,
        },
      });

      // 生成 JWT token
      const token = this.generateToken(user.id, user.email, user.role);

      logger.info("User registered successfully", {
        userId: user.id,
        email: user.email,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      };
    } catch (error) {
      logger.error("Registration error", { error, email: data.email });
      throw new Error("Registration failed");
    }
  }

  /**
   * 用戶登入
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    if (!validateEmail(data.email)) {
      throw new ValidationError("email", "Invalid email format");
    }

    try {
      // 查找用戶
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          playerProfile: true,
        },
      });

      if (!user) {
        throw new ValidationError("email", "User not found");
      }

      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new ValidationError("password", "Invalid password");
      }

      // 生成 JWT token
      const token = this.generateToken(user.id, user.email, user.role);

      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error("Login error", { error, email: data.email });
      throw new Error("Login failed");
    }
  }

  /**
   * 驗證 JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown;
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "id" in decoded &&
        "email" in decoded &&
        "role" in decoded &&
        "iat" in decoded &&
        "exp" in decoded
      ) {
        return decoded as JWTPayload;
      }
      throw new Error("Invalid token payload");
    } catch (error) {
      logger.error("Token verification failed", { error });
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * 生成 JWT token
   */
  static generateToken(userId: string, email: string, role: string): string {
    const payload: Omit<JWTPayload, "iat" | "exp"> = {
      id: userId,
      email,
      role: role as "PLAYER" | "ORGANIZER" | "ADMIN",
    };

    const options = {
      expiresIn: JWT_EXPIRE,
    } as SignOptions;

    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * 獲取用戶信息
   */
  static async getUserInfo(userId: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          playerProfile: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // 不包含密碼
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: "", // 返回空 token
      };
    } catch (error) {
      logger.error("Get user info error", { error, userId });
      throw new Error("Failed to get user info");
    }
  }

  /**
   * 更新用戶資料
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileRequest
  ): Promise<AuthResponse> {
    try {
      // 驗證輸入
      if (data.name !== undefined) {
        const nameValidation = validateName(data.name);
        if (!nameValidation.valid) {
          throw new ValidationError(
            "name",
            nameValidation.message || "Invalid name"
          );
        }
      }

      if (data.phone !== undefined) {
        const phoneValidation = validatePhone(data.phone);
        if (!phoneValidation.valid) {
          throw new ValidationError(
            "phone",
            phoneValidation.message || "Invalid phone"
          );
        }
      }

      if (data.skillLevel !== undefined) {
        const skillValidation = validateSkillLevel(data.skillLevel);
        if (!skillValidation.valid) {
          throw new ValidationError(
            "skillLevel",
            skillValidation.message || "Invalid skill level"
          );
        }
      }

      // 更新用戶資料
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          playerProfile: true,
        },
      });

      // 如果更新了技能等級，同時更新 playerProfile
      if (data.skillLevel !== undefined) {
        await prisma.playerProfile.update({
          where: { userId },
          data: { skillLevel: data.skillLevel },
        });
      }

      logger.info("User profile updated", { userId });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token: "",
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error("Update profile error", { error, userId });
      throw new Error("Failed to update profile");
    }
  }
}
