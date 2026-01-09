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
   * Update own profile
   */
  async updateOwnProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.updateOwnProfile(userId, req.body);
      return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update own password
   */
  async updateOwnPassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      const result = await userService.updateOwnPassword(userId, currentPassword, newPassword);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update receptionist (doctor only)
   */
  async updateReceptionist(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = req.user.id;
      const receptionist = await userService.updateReceptionist(id, doctorId, req.body);
      return successResponse(res, receptionist, 'Receptionist updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receptionists by consultorio
   */
  async getReceptionistsByConsultorio(req, res, next) {
    try {
      const { consultorioId } = req.query;
      if (!consultorioId) {
        return res.status(400).json({
          success: false,
          message: 'consultorioId is required',
        });
      }
      const receptionists = await userService.getReceptionistsByConsultorio(consultorioId);
      return successResponse(res, receptionists);
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

  /**
   * Update user password
   */
  async updatePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const result = await userService.updatePassword(id, password);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const user = await userService.toggleUserStatus(id, isActive);
      const message = isActive ? 'User activated successfully' : 'User deactivated successfully';
      return successResponse(res, user, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user by doctor (only for their consultorios)
   */
  async createUserByDoctor(req, res, next) {
    try {
      const { password = 'changeme123', ...userData } = req.body;
      const doctorId = req.user.id;
      
      const user = await userService.createUserByDoctor(userData, password, doctorId);
      return createdResponse(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user by doctor (only for their consultorios)
   */
  async updateUserByDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = req.user.id;
      
      const user = await userService.updateUserByDoctor(id, req.body, doctorId);
      return successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user by doctor (only for their consultorios)
   */
  async deleteUserByDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = req.user.id;
      
      const result = await userService.deleteUserByDoctor(id, doctorId);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
