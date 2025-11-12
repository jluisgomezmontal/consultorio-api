import userService from '../services/user.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';

class UserController {
  /**
   * Get all users
   */
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, consultorioId } = req.query;
      const result = await userService.getAllUsers(
        parseInt(page),
        parseInt(limit),
        consultorioId
      );
      return paginatedResponse(res, result.users, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      const { password = 'changeme123', ...userData } = req.body;
      const user = await userService.createUser(userData, password);
      return createdResponse(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      return successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctors
   */
  async getDoctors(req, res, next) {
    try {
      const { consultorioId } = req.query;
      const doctors = await userService.getDoctors(consultorioId);
      return successResponse(res, doctors);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
