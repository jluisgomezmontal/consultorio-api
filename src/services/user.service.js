import bcrypt from 'bcrypt';
import { User, Consultorio, Cita } from '../models/index.js';
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
    const transformedUsers = users.map((user) => {
      const { _id, consultorioId, ...rest } = user;
      
      const consultorioObject =
        consultorioId && typeof consultorioId === 'object' && '_id' in consultorioId
          ? consultorioId
          : null;

      return {
        ...rest,
        id: _id?.toString?.() ?? user.id,
        consultorioId:
          consultorioObject?._id?.toString?.() ?? consultorioId?.toString?.() ?? null,
        consultorio: consultorioObject,
      };
    });

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
    const { _id, consultorioId, ...rest } = user;
    
    const consultorioObject =
      consultorioId && typeof consultorioId === 'object' && '_id' in consultorioId
        ? consultorioId
        : null;

    return {
      ...rest,
      id: _id?.toString?.() ?? user.id,
      consultorioId:
        consultorioObject?._id?.toString?.() ?? consultorioId?.toString?.() ?? null,
      consultorio: consultorioObject,
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      consultorioId: data.consultorioId,
    });

    const populatedUser = await User.findById(user._id).populate('consultorioId').lean();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = populatedUser;

    // Transform consultorioId to consultorio for compatibility
    return {
      ...userWithoutPassword,
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

    // Transform lean documents to include id field and populated consultorio info
    return doctors.map((doctor) => {
      const { _id, consultorioId, ...rest } = doctor;

      const consultorioObject =
        consultorioId && typeof consultorioId === 'object' && '_id' in consultorioId
          ? consultorioId
          : null;

      return {
        ...rest,
        id: _id?.toString?.() ?? doctor.id,
        consultorioId:
          consultorioObject?._id?.toString?.() ?? consultorioId?.toString?.() ?? null,
        consultorio: consultorioObject,
      };
    });
  }
}

export default new UserService();
