
export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
  popularityScore: number;
}


export interface GraphState {
  nodes: any[]; 
  edges: any[]; 
  users: User[];
  isLoading: boolean;
  error: string | null;
}