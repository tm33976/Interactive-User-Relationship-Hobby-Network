import { server } from './setup'; // We import our server wrapper

// We group our tests together with 'describe'
describe('User & Graph API Logic Tests', () => {
  
  // These variables will be re-set before each test
  let userA_id: string;
  let userB_id: string;
  let userC_id: string; // For the 'create' test

  // --- THIS IS THE FIX ---
  // This hook runs *before each test* in this file.
  // It runs *after* the database wipe in setup.ts
  beforeEach(async () => {
    // 1. Create User A
    const resA = await server.post('/api/users').send({
      username: 'UserA',
      age: 30,
      hobbies: ['Gaming', 'Reading', 'Coding'],
    });
    userA_id = resA.body.data.users.find((u: any) => u.username === 'UserA').id;

    // 2. Create User B
    const resB = await server.post('/api/users').send({
      username: 'UserB',
      age: 25,
      hobbies: ['Reading', 'Hiking'], // Note: 'Reading' is shared
    });
    userB_id = resB.body.data.users.find((u: any) => u.username === 'UserB').id;
  });
  // --- END OF FIX ---

  // Test 1: Test creating a user (this is the new test 1)
  test('should create a new user', async () => {
    const res = await server.post('/api/users').send({
      username: 'UserC',
      age: 50,
      hobbies: ['Sailing'],
    });
    
    expect(res.statusCode).toEqual(200);
    const userC = res.body.data.users.find((u: any) => u.username === 'UserC');
    expect(userC).toBeDefined();
    userC_id = userC.id;
  });
  
  // Test 2: Can we link A and B? (This tests the Popularity Score)
  test('should link User A and User B and calculate scores', async () => {
    // User A and B already exist from the beforeEach hook
    const res = await server.post(`/api/users/${userA_id}/link`).send({
      friendId: userB_id,
    });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Friendship created');

    const nodeA = res.body.data.nodes.find((n: any) => n.id === userA_id);
    const nodeB = res.body.data.nodes.find((n: any) => n.id === userB_id);

    // --- Popularity Score Logic Test ---
    // They share one hobby: 'Reading'
    // Score = 1 friend + (1 shared hobby * 0.5) = 1.5
    expect(nodeA.data.popularityScore).toEqual(1.5);
    expect(nodeB.data.popularityScore).toEqual(1.5);

    // Check if the edge (the line) was created
    const edge = res.body.data.edges.find((e: any) => e.source === userA_id || e.target === userA_id);
    expect(edge).toBeDefined();
  });

  // Test 3: Does the score update (Bonus Logic)
  test('popularity score should update when hobbies change', async () => {
    // First, link them
    await server.post(`/api/users/${userA_id}/link`).send({ friendId: userB_id });
    
    // Now, update User B's hobbies
    const res = await server.put(`/api/users/${userB_id}`).send({
      hobbies: ['Reading', 'Hiking', 'Coding'], // Now they share 'Reading' AND 'Coding'
    });
    
    expect(res.statusCode).toEqual(200);
    
    const nodeA = res.body.data.nodes.find((n: any) => n.id === userA_id);
    const nodeB = res.body.data.nodes.find((n: any) => n.id === userB_id);

    // --- New Score Test ---
    // Score = 1 friend + (2 shared hobbies * 0.5) = 2.0
    expect(nodeA.data.popularityScore).toEqual(2.0);
    expect(nodeB.data.popularityScore).toEqual(2.0);

    // Check Bonus Node Type (score is 2.0, so should be 'lowScoreNode')
    expect(nodeA.type).toEqual('lowScoreNode');
  });

  // Test 4: Can we delete a user who has friends? (Deletion Rule)
  test('should FAIL to delete User A while they are still linked', async () => {
    // Link them first
    await server.post(`/api/users/${userA_id}/link`).send({ friendId: userB_id });
    
    // Then, try to delete User A
    const res = await server.delete(`/api/users/${userA_id}`);
    
    // 409 Conflict
    expect(res.statusCode).toEqual(409); 
    expect(res.body.message).toContain('unlink all friendships first');
  });

  // Test 5: Can we unlink them?
  test('should unlink User A and User B', async () => {
    // Link them first
    await server.post(`/api/users/${userA_id}/link`).send({ friendId: userB_id });
    
    // Now, unlink them
    const res = await server.post(`/api/users/${userA_id}/unlink`).send({
      friendId: userB_id,
    });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Friendship removed');

    // Scores should be 0 (no friends)
    const nodeA = res.body.data.nodes.find((n: any) => n.id === userA_id);
    expect(nodeA.data.popularityScore).toEqual(0);
    
    // No edges
    expect(res.body.data.edges.length).toEqual(0);
  });

  // Test 6: Can we delete a user *after* unlinking?
  test('should SUCCEED in deleting User A (now unlinked)', async () => {
    // Users A and B exist, but are not linked.
    const res = await server.delete(`/api/users/${userA_id}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('User deleted successfully');
    
    // Check that User A is gone
    const users = res.body.data.users;
    const userA = users.find((u: any) => u.id === userA_id);
    expect(userA).toBeUndefined();
  });
});