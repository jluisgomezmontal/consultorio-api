import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { createUserSchema, updateUserSchema, getUserSchema, updatePasswordSchema } from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// Get doctors (all authenticated users can access)
router.get('/doctors', userController.getDoctors);

// Get user by ID
router.get('/:id', validate(getUserSchema), userController.getUserById);

// Create user (admin only)
router.post('/', authorize('admin'), validate(createUserSchema), userController.createUser);

// Update user (admin only)
router.put('/:id', authorize('admin'), validate(updateUserSchema), userController.updateUser);

// Update user password (admin only)
router.patch('/:id/password', authorize('admin'), validate(updatePasswordSchema), userController.updatePassword);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), validate(getUserSchema), userController.deleteUser);

export default router;
