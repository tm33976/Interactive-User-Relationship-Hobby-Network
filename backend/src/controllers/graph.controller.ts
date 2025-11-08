import UserModel, { IUser } from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import { Response } from 'express';

/**
 * --- Private Helper Function ---
 */
// --- FIX: Revert types to generic 'any' arrays ---
const getGraphDataPayload = async (): Promise<{
  nodes: any[];
  edges: any[];
  users: IUser[];
}> => {
  // --- END OF FIX ---

  // 1. Fetch all users
  const allUsers = await UserModel.find({});

  // 2. Calculate popularity scores
  const usersWithScores = await Promise.all(
    allUsers.map(async (user) => {
      const score = await user.calculatePopularityScore(allUsers);
      const userObj = user.toObject();
      userObj.popularityScore = score;
      return userObj;
    })
  );

  // 3. Map users to React Flow 'nodes'
  // --- FIX: Revert type to generic 'any' array ---
  const nodes: any[] = usersWithScores.map((user) => {
    const nodeType = user.popularityScore > 5 ? 'highScoreNode' : 'lowScoreNode';

    return {
      id: user.id.toString(),
      type: nodeType,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      // --- FIX: Simplified data object. We ONLY send what the frontend needs. ---
      data: {
        id: user.id.toString(),
        username: user.username,
        age: user.age,
        hobbies: user.hobbies,
        popularityScore: user.popularityScore,
      },
      // --- END OF FIX ---
    };
  });

  // 4. Map friendships to React Flow 'edges'
  // --- FIX: Revert type to generic 'any' array ---
  const edges: any[] = [];
  const edgeSet = new Set<string>();

  for (const user of usersWithScores) {
    for (const friendId of user.friends) {
      const edgeKey = [user.id.toString(), friendId].sort().join('-');

      if (!edgeSet.has(edgeKey)) {
        edges.push({
          id: edgeKey,
          source: user.id.toString(),
          target: friendId,
          animated: true,
        });
        edgeSet.add(edgeKey);
      }
    }
  }

  return { nodes, edges, users: usersWithScores };
};

/**
 * @desc    Get all data for the graph (nodes and edges)
 * @route   GET /api/graph
 * @access  Public
 */
export const getGraphData = asyncHandler(async (req, res, next) => {
  const graphData = await getGraphDataPayload();
  res.status(200).json({
    status: 'success',
    data: graphData,
  });
});

/**
 * --- Public Helper Function ---
 */
export const sendLatestGraphData = async (res: Response, message: string) => {
  const graphData = await getGraphDataPayload();
  res.status(200).json({
    status: 'success',
    message,
    data: graphData,
  });
};
