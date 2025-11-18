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
      filter.consultoriosIds = consultorioId;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('consultoriosIds')
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    // Transform consultoriosIds to consultorios
    const transformedUsers = users.map((user) => {
      const { _id, consultoriosIds, ...rest } = user;
      
      const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

      return {
        ...rest,
        id: _id?.toString?.() ?? user.id,
        consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
        consultorios: consultoriosArray,
      };
    });

    return { users: transformedUsers, total, page, limit };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await User.findById(id).populate('consultoriosIds').lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Transform consultoriosIds to consultorios
    const { _id, consultoriosIds, ...rest } = user;
    
    const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

    return {
      ...rest,
      id: _id?.toString?.() ?? user.id,
      consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
      consultorios: consultoriosArray,
    };
  }

  /**
   * Create new user
   */
  async createUser(data, password) {
    // Ensure consultoriosIds is an array
    const consultoriosIds = Array.isArray(data.consultoriosIds) ? data.consultoriosIds : [];

    // Check if all consultorios exist
    if (consultoriosIds.length > 0) {
      const consultorios = await Consultorio.find({ _id: { $in: consultoriosIds } });
      if (consultorios.length !== consultoriosIds.length) {
        throw new NotFoundError('One or more consultorios not found');
      }
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
      consultoriosIds: consultoriosIds,
    });

    const populatedUser = await User.findById(user._id).populate('consultoriosIds').lean();

    // Remove password from response
    const { password: _, consultoriosIds: consultorios, ...userWithoutPassword } = populatedUser;

    return {
      ...userWithoutPassword,
      consultoriosIds: (consultorios || []).map(c => c?._id?.toString() || c?.toString() || c),
      consultorios: consultorios || [],
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

    // If changing consultorios, verify they exist
    if (data.consultoriosIds && Array.isArray(data.consultoriosIds)) {
      const consultorios = await Consultorio.find({ _id: { $in: data.consultoriosIds } });

      if (consultorios.length !== data.consultoriosIds.length) {
        throw new NotFoundError('One or more consultorios not found');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('consultoriosIds')
      .lean();

    const { consultoriosIds, ...rest } = updatedUser;
    const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

    return {
      ...rest,
      consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
      consultorios: consultoriosArray,
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
    const users = await User.find({ consultoriosIds: consultorioId }).populate('consultoriosIds').lean();

    return users.map((user) => {
      const { _id, consultoriosIds, ...rest } = user;
      const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

      return {
        ...rest,
        id: _id?.toString?.() ?? user.id,
        consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
        consultorios: consultoriosArray,
      };
    });
  }

  /**
   * Get doctors
   */
  async getDoctors(consultorioId = null) {
    const filter = { role: 'doctor' };
    if (consultorioId) {
      filter.consultoriosIds = consultorioId;
    }

    const doctors = await User.find(filter).populate('consultoriosIds').lean();

    return doctors.map((doctor) => {
      const { _id, consultoriosIds, ...rest } = doctor;
      const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

      return {
        ...rest,
        id: _id?.toString?.() ?? doctor.id,
        consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
        consultorios: consultoriosArray,
      };
    });
  }
}

export default new UserService();
