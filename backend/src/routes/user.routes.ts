import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

//  User CRUD 
// /api/users
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

// /api/users/:id
router
  .route('/:id')
  .put(userController.updateUser)
  .delete(userController.deleteUser);

//  Relationship Management 

// POST /api/users/:id/link
// This matches the spec perfectly.
// Body will contain { friendId }
router.post('/:id/link', userController.linkUsers);

// DELETE /api/users/:id/unlink

// DELETE /api/users/:userId/friends/:friendId

router.post('/:id/unlink', userController.unlinkUsers);

export default router;