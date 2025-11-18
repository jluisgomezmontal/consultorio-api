import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email, password) {
    // Get user from database (explicitly select password since it's excluded by default)
    const user = await User.findOne({ email }).select('+password').populate('consultoriosIds').lean();

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    const consultoriosArray = Array.isArray(user.consultoriosIds) ? user.consultoriosIds : [];

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
        consultorios: consultoriosArray,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).lean();
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new token
      const accessToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId).populate('consultoriosIds').lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { _id, consultoriosIds, ...rest } = user;
    const consultoriosArray = Array.isArray(consultoriosIds) ? consultoriosIds : [];

    return {
      ...rest,
      id: _id?.toString(),
      consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
      consultorios: consultoriosArray,
    };
  }

  /**
   * Register a new user (admin only)
   */
  async register(email, password, userData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure consultoriosIds is an array
    const consultoriosIds = Array.isArray(userData.consultoriosIds) ? userData.consultoriosIds : [];

    // Create user in database
    const user = await User.create({
      email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      consultoriosIds: consultoriosIds,
    });

    const populatedUser = await User.findById(user._id).populate('consultoriosIds').lean();

    // Remove password from response
    const { password: _, consultoriosIds: consultorios, ...userWithoutPassword } = populatedUser;
    const consultoriosArray = Array.isArray(consultorios) ? consultorios : [];

    return {
      ...userWithoutPassword,
      consultoriosIds: consultoriosArray.map(c => c?._id?.toString() || c?.toString() || c),
      consultorios: consultoriosArray,
    };
  }

  /**
   * Logout user
   */
  async logout() {
    // With JWT, logout is handled client-side by removing the token
    return { message: 'Logged out successfully' };
  }
}

export default new AuthService();
