import { supabase, supabaseAdmin } from '../config/supabase.js';
import { User } from '../models/index.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user from database
    const user = await User.findOne({ email }).populate('consultorioId').lean();

    if (!user) {
      throw new NotFoundError('User not found in system');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        consultorio: user.consultorioId,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId).populate('consultorioId').lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      consultorio: user.consultorioId,
    };
  }

  /**
   * Register a new user in Supabase (admin only)
   */
  async register(email, password, userData) {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create user in database
    const user = await User.create({
      email,
      name: userData.name,
      role: userData.role,
      consultorioId: userData.consultorioId,
    });

    const populatedUser = await User.findById(user._id).populate('consultorioId').lean();

    return {
      ...populatedUser,
      consultorio: populatedUser.consultorioId,
    };
  }

  /**
   * Logout user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error('Failed to logout');
    }

    return { message: 'Logged out successfully' };
  }
}

export default new AuthService();
