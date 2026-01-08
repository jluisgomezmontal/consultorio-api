import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { checkLimiteUsuarios } from '../middlewares/checkPaquete.js';
import { 
  createUserSchema, 
  updateUserSchema, 
  getUserSchema, 
  updatePasswordSchema, 
  toggleUserStatusSchema,
  updateOwnProfileSchema,
  updateOwnPasswordSchema,
  updateReceptionistSchema
} from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// Get doctors (all authenticated users can access)
router.get('/doctors', userController.getDoctors);

// Get receptionists by consultorio (authenticated users)
router.get('/receptionists', userController.getReceptionistsByConsultorio);

// Update own profile (authenticated users)
router.put('/me/profile', validate(updateOwnProfileSchema), userController.updateOwnProfile);

// Update own password (authenticated users)
router.put('/me/password', validate(updateOwnPasswordSchema), userController.updateOwnPassword);

// Update receptionist (doctors only)
router.put('/receptionists/:id', authorize('doctor'), validate(updateReceptionistSchema), userController.updateReceptionist);

// Get user by ID
router.get('/:id', validate(getUserSchema), userController.getUserById);

// Create user (admin only) - with package limit validation
router.post('/', authorize('admin'), validate(createUserSchema), checkLimiteUsuarios('doctor'), checkLimiteUsuarios('recepcionista'), userController.createUser);

// Update user (admin only)
router.put('/:id', authorize('admin'), validate(updateUserSchema), userController.updateUser);

// Update user password (admin only)
router.patch('/:id/password', authorize('admin'), validate(updatePasswordSchema), userController.updatePassword);

// Toggle user active status (admin only)
router.patch('/:id/status', authorize('admin'), validate(toggleUserStatusSchema), userController.toggleUserStatus);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), validate(getUserSchema), userController.deleteUser);

export default router;
