import authService from '../services/auth.service.js';
import { successResponse, createdResponse } from '../utils/response.js';

class AuthController {
  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new user (admin only)
   */
  async register(req, res, next) {
    try {
      const { email, password, name, role, consultoriosIds } = req.body;
      const user = await authService.register(email, password, {
        name,
        role,
        consultoriosIds,
      });
      return createdResponse(res, user, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const result = await authService.logout();
      return successResponse(res, result, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
