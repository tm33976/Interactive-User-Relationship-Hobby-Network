import UserModel, { IUser } from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import { Response } from 'express';
import { Node, Edge } from 'reactflow'; // Using React Flow types for clarity

/**
 * --- Private Helper Function ---
 * This is the heart of our state-sync logic.
 */
const getGraphDataPayload = async (): Promise<{
  nodes: Node<IUser>[]; // We can strongly type this now
  edges: Edge[];
  users: IUser[];
}> => {
  // 1. Fetch all users
  const allUsers = await UserModel.find({});

  // 2. Calculate popularity scores for everyone
  const usersWithScores = await Promise.all(
    allUsers.map(async (user) => {
      const score = await user.calculatePopularityScore(allUsers);
      const userObj = user.toObject();
      userObj.popularityScore = score;
      return userObj;
    })
  );

  // 3. Map users to React Flow 'nodes'
  const nodes: Node<IUser>[] = usersWithScores.map((user) => {
    const nodeType = user.popularityScore > 5 ? 'highScoreNode' : 'lowScoreNode';

    return {
      id: user.id.toString(),
      type: nodeType,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        // --- THIS IS THE FIX ---
        // We must include the id *inside* the data prop
        // so our CustomNode can access it.
        id: user.id.toString(),
        // --- END OF FIX ---
        
        username: user.username,
        age: user.age,
        hobbies: user.hobbies,
        popularityScore: user.popularityScore,
        
        // We need to satisfy the IUser type, but these aren't needed
        // in the node data itself.
        _id: user.id.toString(),
        friends: user.friends,
        createdAt: user.createdAt,
        calculatePopularityScore: () => Promise.resolve(0),
        isFriendWith: () => false,
      },
    };
  });

  // 4. Map friendships to React Flow 'edges'
  const edges: Edge[] = [];
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