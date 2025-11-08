import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import apiService, { handleApiError } from "../api/apiService";
import type { GraphState } from "../lib/types";
import type { User } from "../lib/types";
import { type Edge, type Node } from "reactflow";

const initialState: GraphState = {
  nodes: [],
  edges: [],
  users: [],
  isLoading: false,
  error: null,
};

interface GraphDataPayload {
  nodes: Node[];
  edges: Edge[];
  users: User[];
}

// GET /api/graph
export const fetchGraphData = createAsyncThunk<GraphDataPayload>(
  "graph/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get("/graph");
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
>("graph/createUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await apiService.post("/users", userData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// PUT /api/users/:id
export const updateUser = createAsyncThunk<
  GraphDataPayload,
  Partial<User> & { id: string }
>("graph/updateUser", async (userData, { rejectWithValue }) => {
  try {
    // We send all fields, but backend only updates what's there
    const response = await apiService.put(`/users/${userData.id}`, userData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// DELETE /api/users/:id
export const deleteUser = createAsyncThunk<GraphDataPayload, string>(
  "graph/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiService.delete(`/users/${userId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// POST /api/users/:id/link
export const linkUsers = createAsyncThunk<
  GraphDataPayload,
  { userId: string; friendId: string }
>("graph/linkUsers", async ({ userId, friendId }, { rejectWithValue }) => {
  try {
    const response = await apiService.post(`/users/${userId}/link`, {
      friendId,
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// POST /api/users/:id/unlink
export const unlinkUsers = createAsyncThunk<
  GraphDataPayload,
  { userId: string; friendId: string }
>("graph/unlinkUsers", async ({ userId, friendId }, { rejectWithValue }) => {
  try {
    // We used POST for unlink to allow a body
    const response = await apiService.post(`/users/${userId}/unlink`, {
      friendId,
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const graphSlice = createSlice({
  name: "graph",
  initialState,

  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
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

    const onPending = (state: GraphState) => {
      state.isLoading = true;
      state.error = null;
    };

    const onRejected = (state: GraphState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload || "An unknown error occurred";
    };

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

export const { setNodes, clearError } = graphSlice.actions;
export default graphSlice.reducer;
