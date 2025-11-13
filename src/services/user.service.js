import { User, Consultorio, Cita } from '../models/index.js';
import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

class UserService {
  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 10, consultorioId = null) {
    const skip = (page - 1) * limit;

    const filter = {};
    if (consultorioId) {
      filter.consultorioId = consultorioId;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('consultorioId')
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    // Transform consultorioId to consultorio for compatibility
    const transformedUsers = users.map((user) => ({
      ...user,
      consultorio: user.consultorioId,
    }));

    return { users: transformedUsers, total, page, limit };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await User.findById(id).populate('consultorioId').lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Transform consultorioId to consultorio for compatibility
    return {
      ...user,
      consultorio: user.consultorioId,
    };
  }

  /**
   * Create new user
   */
  async createUser(data, password) {
    // Check if consultorio exists
    const consultorio = await Consultorio.findById(data.consultorioId);

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
    const user = await User.create({
      email: data.email,
      name: data.name,
      role: data.role,
      consultorioId: data.consultorioId,
    });

    const populatedUser = await User.findById(user._id).populate('consultorioId').lean();

    // Transform consultorioId to consultorio for compatibility
    return {
      ...populatedUser,
      consultorio: populatedUser.consultorioId,
    };
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If changing consultorio, verify it exists
    if (data.consultorioId && data.consultorioId !== user.consultorioId.toString()) {
      const consultorio = await Consultorio.findById(data.consultorioId);

      if (!consultorio) {
        throw new NotFoundError('Consultorio not found');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('consultorioId')
      .lean();

    // Transform consultorioId to consultorio for compatibility
    return {
      ...updatedUser,
      consultorio: updatedUser.consultorioId,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has citas with restrict behavior
    const citasCount = await Cita.countDocuments({ doctorId: id });
    if (citasCount > 0) {
      throw new BadRequestError('Cannot delete user with existing citas');
    }

    // Delete from database
    await User.findByIdAndDelete(id);

    // Delete from Supabase Auth
    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
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
    const users = await User.find({ consultorioId }).populate('consultorioId').lean();

    // Transform consultorioId to consultorio for compatibility
    return users.map((user) => ({
      ...user,
      consultorio: user.consultorioId,
    }));
  }

  /**
   * Get doctors
   */
  async getDoctors(consultorioId = null) {
    const filter = { role: 'doctor' };
    if (consultorioId) {
      filter.consultorioId = consultorioId;
    }

    const doctors = await User.find(filter).populate('consultorioId').lean();

    // Transform consultorioId to consultorio for compatibility
    return doctors.map((doctor) => ({
      ...doctor,
      consultorio: doctor.consultorioId,
    }));
  }
}

export default new UserService();
