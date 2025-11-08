import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type { DragEvent, FormEvent } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  type OnConnect,
  type Node,
  type Edge,
  type OnEdgesDelete,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Toaster, toast } from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  Trash2,
  X,
  Menu,
  AlertTriangle,
  Link,
  Loader2,
  Droplet,
} from 'lucide-react';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState } from './redux/store';

const useAppDispatch = () => useDispatch<any>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
import {
  fetchGraphData,
  createUser,
  updateUser,
  deleteUser,
  linkUsers,
  unlinkUsers,
  clearError,
} from './redux/graphSlice';
import type { User } from './lib/types';

// Custom Node Imports (Bonus)
import { HighScoreNode, LowScoreNode } from './components/CustomNodes';

// For the Bonus, we map our node types
const nodeTypes = {
  highScoreNode: HighScoreNode,
  lowScoreNode: LowScoreNode,
};

//  1. Main App Component (Wrapper)
function App() {
  return (
    <ReactFlowProvider>
      <GraphApp />
    </ReactFlowProvider>
  );
}

//The Main Application UI
function GraphApp() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.graph);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchGraphData());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-900 text-zinc-100">
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!bg-zinc-700 !text-zinc-100',
        }}
      />
      {isLoading && <LoadingSpinner />}

      <button
        onClick={() => setIsLeftSidebarOpen(true)}
        className="sm:hidden absolute top-4 left-4 z-20 p-2 bg-zinc-800/80 backdrop-blur-md rounded-lg"
      >
        <Droplet className="w-5 h-5" />
      </button>
      <button
        onClick={() => setIsRightSidebarOpen(true)}
        className="sm:hidden absolute top-4 right-4 z-20 p-2 bg-zinc-800/80 backdrop-blur-md rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Sidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />
      
      <div className="w-full h-full">
        <GraphCanvas onNodeClick={(id) => {
          setSelectedNodeId(id);
          setIsRightSidebarOpen(true);
        }} />
      </div>

      <ManagementPanel
        isOpen={isRightSidebarOpen}
        onClose={() => {
          setIsRightSidebarOpen(false);
          setSelectedNodeId(null);
        }}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
}

//The React Flow Graph Canvas
function GraphCanvas({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  const dispatch = useAppDispatch();
  const { nodes: storeNodes, edges: storeEdges } = useAppSelector(
    (state) => state.graph
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project } = useReactFlow();

 
  useEffect(() => {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  
  const onNodesChangeDebounced = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (params.source && params.target) {
        toast.promise(
          dispatch(
            linkUsers({ userId: params.source, friendId: params.target })
          ).unwrap(),
          {
            loading: 'Linking users...',
            success: 'Users linked!',
            error: (err) => err.toString(),
          }
        );
      }
    },
    [dispatch]
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edgesToDelete) => {
      const edge = edgesToDelete[0];
      if (!edge) return;

      toast.promise(
        dispatch(
          unlinkUsers({ userId: edge.source, friendId: edge.target })
        ).unwrap(),
        {
          loading: 'Unlinking users...',
          success: 'Friendship removed!',
          error: (err) => err.toString(),
        }
      );
    },
    [dispatch]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onNodeClickCallback = (_event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgesDelete={onEdgesDelete}
      onNodeClick={onNodeClickCallback}
      onDragOver={onDragOver} 
      nodeTypes={nodeTypes}
      fitView
      className="bg-zinc-800"
    >
      <Controls />
      <Background color="#52525b" gap={16} />
    </ReactFlow>
  );
}

//  4. The Hobbies Sidebar (Left)
function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const users = useAppSelector((state) => state.graph.users);
  const [filter, setFilter] = useState('');

  // Fix for duplicate hobbies
  const allHobbies = useMemo(() => {
    const hobbySet = new Set<string>();
    ['Gaming', 'Reading', 'Hiking', 'Coding', 'Cooking'].forEach(h => hobbySet.add(h));
    users.forEach((user) => {
      user.hobbies.forEach((hobby) => hobbySet.add(hobby));
    });
    return Array.from(hobbySet).sort();
  }, [users]);

  const filteredHobbies = allHobbies.filter((hobby) =>
    hobby.toLowerCase().includes(filter.toLowerCase())
  );
  
  const onDragStart = (event: DragEvent, hobbyName: string) => {
    event.dataTransfer.setData('application/reactflow', 'hobby');
    event.dataTransfer.setData('hobbyName', hobbyName);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`
        absolute top-0 left-0 z-10 h-full
        sm:h-auto sm:top-4 sm:left-4 sm:max-h-[calc(100vh-2rem)]
        bg-zinc-800/80 backdrop-blur-md border border-zinc-700/80 rounded-lg
        shadow-xl w-64 p-4 transition-transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        sm:translate-x-0
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Droplet className="w-5 h-5 mr-2 text-green-400" />
          Hobbies
        </h2>
        <button onClick={onClose} className="sm:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search hobbies..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 pl-8 pr-2 text-sm"
        />
        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] sm:max-h-[calc(100vh-12rem)]">
        {filteredHobbies.map((hobby) => (
          <div
            key={hobby}
            draggable
            onDragStart={(e) => onDragStart(e, hobby)}
            className="
              bg-green-800/50 text-green-300 rounded-md px-3 py-2
              text-sm font-medium cursor-grab active:cursor-grabbing
              transition-colors hover:bg-green-700/60
            "
          >
            {hobby}
          </div>
        ))}
        {filteredHobbies.length === 0 && (
          <p className="text-sm text-zinc-400 italic text-center">
            No hobbies found.
          </p>
        )}
      </div>
    </div>
  );
}

//  The Management Panel (Right) 
function ManagementPanel({
  isOpen,
  onClose,
  selectedNodeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId: string | null;
}) {
  const selectedUser = useAppSelector((state: RootState) =>
    state.graph.users.find((u) => u.id === selectedNodeId)
  );

  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    setActiveTab(selectedUser ? 'edit' : 'create');
  }, [selectedUser]);

  return (
    <div
      className={`
        absolute top-0 right-0 z-10 h-full
        sm:h-auto sm:top-4 sm:right-4 sm:max-h-[calc(100vh-2rem)]
        bg-zinc-800/80 backdrop-blur-md border border-zinc-700/80 rounded-lg
        shadow-xl w-72 p-4 transition-transform
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        sm:translate-x-0
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-400" />
          Management
        </h2>
        <button onClick={onClose} className="sm:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex mb-4 border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'create'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-zinc-400'
          }`}
        >
          Create User
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          disabled={!selectedUser}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'edit'
              ? 'border-b-2 border-blue-500 text-white'
              : 'text-zinc-400'
          } disabled:text-zinc-600 disabled:cursor-not-allowed`}
        >
          Edit User
        </button>
      </div>

      <div className="overflow-y-auto max-h-[70vh] sm:max-h-[calc(100vh-12rem)]">
        {activeTab === 'create' && <CreateUserForm onCreated={onClose} />}
        {activeTab === 'edit' && selectedUser && (
          <EditUserForm user={selectedUser} onUpdated={onClose} />
        )}
      </div>
    </div>
  );
}

// 6. Create User Form
function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [hobbies, setHobbies] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username || !age) {
      toast.error('Username and Age are required.');
      return;
    }

    toast.promise(
      dispatch(
        createUser({
          username,
          age: parseInt(age),
          hobbies: hobbies.split(',').filter(Boolean).map(h => h.trim()),
        })
      ).unwrap(),
      {
        loading: 'Creating user...',
        success: (data) => {
          onCreated();
          return 'User created!';
        },
        error: (err) => err.toString(),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="Username"
        value={username}
        onChange={setUsername}
        required
      />
      <FormInput
        label="Age"
        value={age}
        onChange={setAge}
        type="number"
        required
      />
      <FormInput
        label="Hobbies (comma separated)"
        value={hobbies}
        onChange={setHobbies}
      />
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create User
      </button>
    </form>
  );
}

// Edit User Form 
function EditUserForm({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: () => void;
}) {
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState(user.username);
  const [age, setAge] = useState(user.age.toString());
  const [hobbies, setHobbies] = useState(user.hobbies.join(', '));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setAge(user.age.toString());
    setHobbies(user.hobbies.join(', '));
  }, [user]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.promise(
      dispatch(
        updateUser({
          id: user.id,
          username,
          age: parseInt(age),
          hobbies: hobbies.split(',').filter(Boolean).map(h => h.trim()),
        })
      ).unwrap(),
      {
        loading: 'Updating user...',
        success: 'User updated!',
        error: (err) => err.toString(),
      }
    );
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(false);
    toast.promise(
      dispatch(deleteUser(user.id)).unwrap(),
      {
        loading: 'Deleting user...',
        success: () => {
          onUpdated();
          return 'User deleted!';
        },
        error: (err) => err.toString(),
      }
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Username"
          value={username}
          onChange={setUsername}
          required
        />
        <FormInput
          label="Age"
          value={age}
          onChange={setAge}
          type="number"
          required
        />
        <FormInput
          label="Hobbies (comma separated)"
          value={hobbies}
          onChange={setHobbies}
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </form>
      {isDeleteModalOpen && (
        <DeleteModal
          username={user.username}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
}

//  Reusable UI Components

function FormInput({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  [key: string]: any;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 px-3 text-sm"
        {...props}
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );
}

function DeleteModal({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-30 bg-zinc-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mr-4" />
          <div>
            <h3 className="text-lg font-bold">Delete User</h3>
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete **{username}**? This action cannot
              be undone.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={onCancel}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;