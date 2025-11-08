import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import apiService, { handleApiError } from '../api/apiService';
import type { GraphState } from '../lib/types';
import type { User } from '../lib/types';
import { type Edge, type Node } from 'reactflow';

// --- 1. Define The Initial State ---
const initialState: GraphState = {
  nodes: [],
  edges: [],
  users: [],
  isLoading: false,
  error: null,
};

// --- 2. Create All Async Thunks (Our API Callers) ---

// This is the data shape our backend sends on *every* successful request
interface GraphDataPayload {
  nodes: Node[];
  edges: Edge[];
  users: User[];
}

// GET /api/graph
export const fetchGraphData = createAsyncThunk<GraphDataPayload>(
  'graph/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/graph');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// POST /api/users
export const createUser = createAsyncThunk<
  GraphDataPayload,
  { username: string; age: number; hobbies?: string[] }
>('graph/createUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await apiService.post('/users', userData);
    return response.data.data; // Backend sends back the *full graph*
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// PUT /api/users/:id
export const updateUser = createAsyncThunk<
  GraphDataPayload,
  Partial<User> & { id: string }
>('graph/updateUser', async (userData, { rejectWithValue }) => {
  try {
    // We send all fields, but backend only updates what's there
    const response = await apiService.put(`/users/${userData.id}`, userData);
    return response.data.data; // Backend sends back the *full graph*
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// DELETE /api/users/:id
export const deleteUser = createAsyncThunk<GraphDataPayload, string>(
  'graph/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiService.delete(`/users/${userId}`);
      return response.data.data; // Backend sends back the *full graph*
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// POST /api/users/:id/link
export const linkUsers = createAsyncThunk<
  GraphDataPayload,
  { userId: string; friendId: string }
>('graph/linkUsers', async ({ userId, friendId }, { rejectWithValue }) => {
  try {
    const response = await apiService.post(`/users/${userId}/link`, {
      friendId,
    });
    return response.data.data; // Backend sends back the *full graph*
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// POST /api/users/:id/unlink
export const unlinkUsers = createAsyncThunk<
  GraphDataPayload,
  { userId: string; friendId: string }
>('graph/unlinkUsers', async ({ userId, friendId }, { rejectWithValue }) => {
  try {
    // We used POST for unlink to allow a body
    const response = await apiService.post(`/users/${userId}/unlink`, {
      friendId,
    });
    return response.data.data; // Backend sends back the *full graph*
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// --- 3. Create the Slice Itself ---

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  // 'reducers' are for simple, synchronous state changes (like local UI)
  reducers: {
    // This will let us update node positions *locally*
    // without calling the API
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    // This will clear any API errors
    clearError: (state) => {
      state.error = null;
    },
  },
  // 'extraReducers' are for *asynchronous* state changes (our API calls)
  extraReducers: (builder) => {
    // This one simple function will handle the "success" case
    // for *all* our API calls.
    const onFulfilled = (
      state: GraphState,
      action: PayloadAction<GraphDataPayload>
    ) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.users = action.payload.users;
      state.isLoading = false;
      state.error = null;
    };

    // This handles the "loading" state
    const onPending = (state: GraphState) => {
      state.isLoading = true;
      state.error = null;
    };

    // This handles the "error" state
    const onRejected = (state: GraphState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload || 'An unknown error occurred';
    };

    // We apply these handlers to all our thunks
    [
      fetchGraphData,
      createUser,
      updateUser,
      deleteUser,
      linkUsers,
      unlinkUsers,
    ].forEach((thunk) => {
      builder
        .addCase(thunk.fulfilled, onFulfilled)
        .addCase(thunk.pending, onPending)
        .addCase(thunk.rejected, onRejected);
    });
  },
});

// Export our actions and reducer
export const { setNodes, clearError } = graphSlice.actions;
export default graphSlice.reducer;