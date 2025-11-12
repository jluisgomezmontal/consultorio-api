import prisma from '../config/database.js';
import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class UserService {
  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 10, consultorioId = null) {
    const skip = (page - 1) * limit;
    
    const where = {};
    if (consultorioId) {
      where.consultorioId = consultorioId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          consultorio: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        consultorio: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Create new user
   */
  async createUser(data, password) {
    // Check if consultorio exists
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: data.consultorioId },
    });

    if (!consultorio) {
      throw new NotFoundError('Consultorio not found');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new BadRequestError(`Failed to create auth user: ${authError.message}`);
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        consultorioId: data.consultorioId,
      },
      include: {
        consultorio: true,
      },
    });

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If changing consultorio, verify it exists
    if (data.consultorioId && data.consultorioId !== user.consultorioId) {
      const consultorio = await prisma.consultorio.findUnique({
        where: { id: data.consultorioId },
      });

      if (!consultorio) {
        throw new NotFoundError('Consultorio not found');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: {
        consultorio: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete from database
    await prisma.user.delete({
      where: { id },
    });

    // Delete from Supabase Auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    } catch (error) {
      // Log error but don't fail if Supabase deletion fails
      console.error('Failed to delete user from Supabase:', error);
    }

    return { message: 'User deleted successfully' };
  }

  /**
   * Get users by consultorio
   */
  async getUsersByConsultorio(consultorioId) {
    const users = await prisma.user.findMany({
      where: { consultorioId },
      include: {
        consultorio: true,
      },
    });

    return users;
  }

  /**
   * Get doctors
   */
  async getDoctors(consultorioId = null) {
    const where = { role: 'doctor' };
    if (consultorioId) {
      where.consultorioId = consultorioId;
    }

    const doctors = await prisma.user.findMany({
      where,
      include: {
        consultorio: true,
      },
    });

    return doctors;
  }
}

export default new UserService();
