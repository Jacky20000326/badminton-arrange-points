import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ValidationError } from "../utils/validation";
import logger from "../utils/logger";

export class AuthController {
  /**
   * 用戶註冊
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, phone, skillLevel } = req.body;

      // 基本驗證
      if (!email || !password || !name || skillLevel === undefined) {
        res.status(400).json({
          error: "Missing required fields: email, password, name, skillLevel",
        });
        return;
      }

      // 呼叫服務層
      const result = await AuthService.register({
        email,
        password,
        name,
        phone,
        skillLevel: parseInt(skillLevel),
      });

      res.status(201).json({
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          field: error.field,
        });
      } else {
        logger.error("Register endpoint error", { error });
        res.status(500).json({
          error: error instanceof Error ? error.message : "Registration failed",
        });
      }
    }
  }

  /**
   * 用戶登入
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: "Missing required fields: email, password",
        });
        return;
      }

      const result = await AuthService.login({
        email,
        password,
      });

      res.status(200).json({
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(401).json({
          error: error.message,
          field: error.field,
        });
      } else {
        logger.error("Login endpoint error", { error });
        res.status(500).json({
          error: error instanceof Error ? error.message : "Login failed",
        });
      }
    }
  }

  /**
   * 獲取當前用戶信息
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await AuthService.getUserInfo(req.user.id);

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      logger.error("Get current user error", { error });
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get user info",
      });
    }
  }

  /**
   * 更新用戶資料
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { name, phone, skillLevel } = req.body;

      const result = await AuthService.updateProfile(req.user.id, {
        name,
        phone,
        skillLevel: skillLevel !== undefined ? parseInt(skillLevel) : undefined,
      });

      res.status(200).json({
        message: "Profile updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          field: error.field,
        });
      } else {
        logger.error("Update profile error", { error });
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to update profile",
        });
      }
    }
  }
}
