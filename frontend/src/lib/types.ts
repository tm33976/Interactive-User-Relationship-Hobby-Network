// This is our main User data type, matching the backend
export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
  popularityScore: number;
}

// This will be the shape of our Redux state
export interface GraphState {
  nodes: any[]; // We'll use React Flow's 'Node' type later
  edges: any[]; // We'll use React Flow's 'Edge' type later
  users: User[];
  isLoading: boolean;
  error: string | null;
}