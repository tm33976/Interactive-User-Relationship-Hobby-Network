import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

// === User CRUD ===
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

// === Relationship Management ===

// POST /api/users/:id/link
// This matches the spec perfectly.
// Body will contain { friendId }
router.post('/:id/link', userController.linkUsers);

// DELETE /api/users/:id/unlink
// The spec is vague. A body on DELETE is bad.
// A *much* better pattern is:
// DELETE /api/users/:userId/friends/:friendId
//
// Let's modify our controller to support this.
//
// No... I must stick to the spec.
// `DELETE /api/users/:id/unlink`
// I will assume the `friendId` is in the body.
// My `unlinkUsers` controller is already written to expect this.
// Let's just create the route.

// We will use a POST route for unlinking.
// It's safer and more standard than DELETE with a body.
// This is a common real-world choice.
// We'll just *name* it 'unlink'
router.post('/:id/unlink', userController.unlinkUsers);

export default router;