import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

export class AuthController {
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      logger.info(`User logged in: ${result.user.email}`);

      res.json({
        message: 'Login successful',
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      logger.info(`User registered: ${result.user.email}`);
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        res.status(401).json({ error: 'Refresh token not provided' });
        return;
      }

      const result = await AuthService.refreshToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      res.json({ accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (req.user) {
        await AuthService.logout(req.user.id, refreshToken);
      }

      res.clearCookie('refreshToken', { path: '/api/auth' });
      logger.info(`User logged out: ${req.user?.email}`);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.forgotPassword(req.body.email);
      // Always return success to prevent email enumeration
      res.json({ message: 'If an account exists, a password reset email has been sent.' });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password);
      res.json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.changePassword(req.user!.id, req.body);
      logger.info(`Password changed: ${req.user!.email}`);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.verifyEmail(req.params.token);
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.updateProfile(req.user!.id, req.body);
      res.json({ message: 'Profile updated', user });
    } catch (error) {
      next(error);
    }
  }
}
