import UserModel from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { sendLatestGraphData } from './graph.controller';

/**
 * @desc    Get all users (we'll replace this with the graph controller)
 * @route   GET /api/users
 * @access  Public
 * @note    This is functionally replaced by GET /api/graph,
 * but we include it to match the spec.
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
  // In our app, the graph controller is better, but we follow the spec
  const users = await UserModel.find({});
  res.status(200).json({
    status: 'success',
    count: users.length,
    data: users,
  });
});

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Public
 */
export const createUser = asyncHandler(async (req, res, next) => {
  const { username, age, hobbies } = req.body;

  if (!username || !age) {
    return next(new AppError('Username and age are required', 400));
  }

  await UserModel.create({
    username,
    age,
    hobbies: hobbies || [],
  });

  // After creating, send back the *entire* updated graph
  // This keeps the frontend state perfectly in sync
  await sendLatestGraphData(res, 'User created successfully');
});

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Public
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { username, age, hobbies } = req.body;

  const user = await UserModel.findByIdAndUpdate(
    id,
    { username, age, hobbies },
    {
      new: true, // Return the new, updated document
      runValidators: true, // Run Mongoose validation
    }
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Hobbies might have changed, so scores will change.
  // Send back the updated graph.
  await sendLatestGraphData(res, 'User updated successfully');
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Public
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await UserModel.findById(id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // --- Requirement 3: Deletion Rules ---
  // A user cannot be deleted while still connected as a friend
  if (user.friends.length > 0) {
    return next(
      new AppError(
        'Cannot delete user. Please unlink all friendships first.',
        409 // 409 Conflict
      )
    );
  }

  // If they have no friends, we can delete them
  await UserModel.findByIdAndDelete(id);

  // Send back the updated graph
  await sendLatestGraphData(res, 'User deleted successfully');
});

/**
 * @desc    Create a relationship (friendship)
 * @route   POST /api/users/:id/link
 * @access  Public
 */
export const linkUsers = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.params;
  const { friendId } = req.body;

  if (userId === friendId) {
    return next(new AppError('Cannot link a user to themselves', 400));
  }

  // Find both users at the same time
  const [user, friend] = await Promise.all([
    UserModel.findById(userId),
    UserModel.findById(friendId),
  ]);

  if (!user || !friend) {
    return next(new AppError('One or both users not found', 404));
  }

  // --- Requirement 3: Circular Friendship Prevention ---
  // We only add if they aren't already friends
  let updated = false;

  if (!user.friends.includes(friendId)) {
    user.friends.push(friendId);
    updated = true;
  }
  if (!friend.friends.includes(userId)) {
    friend.friends.push(userId);
    updated = true;
  }

  if (!updated) {
    return next(new AppError('Users are already friends', 400));
  }

  // Save both updates
  await Promise.all([user.save(), friend.save()]);

  // Friendships changed, so scores will change.
  // Send back the updated graph.
  await sendLatestGraphData(res, 'Friendship created');
});

/**
 * @desc    Remove a relationship (friendship)
 * @route   DELETE /api/users/:id/unlink
 * @access  Public
 */
export const unlinkUsers = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.params;
  const { friendId } = req.body; // We'll expect the friendId in the body

  if (!friendId) {
    return next(new AppError('friendId is required in the body', 400));
  }

  // Find both users
  const [user, friend] = await Promise.all([
    UserModel.findById(userId),
    UserModel.findById(friendId),
  ]);

  if (!user || !friend) {
    return next(new AppError('One or both users not found', 404));
  }

  // Remove the friend from each user's list
  // This is safe even if they aren't friends
  user.friends = user.friends.filter((id) => id !== friendId);
  friend.friends = friend.friends.filter((id) => id !== userId);

  // Save both updates
  await Promise.all([user.save(), friend.save()]);

  // Friendships changed, so scores will change.
  // Send back the updated graph.
  await sendLatestGraphData(res, 'Friendship removed');
});