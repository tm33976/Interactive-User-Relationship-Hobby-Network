import { memo } from 'react';
import type { DragEvent } from 'react';
import { Handle, Position, type  NodeProps } from 'reactflow';
import type { User } from '../lib/types';

import { updateUser } from '../redux/graphSlice';
import { debounce } from '../utils/debounce';
import { Users, Droplet, Star } from 'lucide-react';


import {  type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../redux/store'


export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
// Create a debounced update function (Bonus Point 10)
// We wrap our dispatch in a debounce so we don't spam the API.
const debouncedUpdateUser = debounce((dispatch, args) => {
  dispatch(updateUser(args));
}, 300); // Wait 300ms after the last drop

// Both nodes will share this structure.
const UserNode = ({
  data,
  isHighScore,
}: {
  data: User;
  isHighScore: boolean;
}) => {
  const dispatch = useAppDispatch();

  // This function handles a hobby being dropped *onto* the node
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // Get the hobby name we stored in onDragStart
    const hobbyName = event.dataTransfer.getData('hobbyName');
    if (!hobbyName) return;

    // Avoid adding duplicate hobbies
    if (!data.hobbies.includes(hobbyName)) {
      const updatedHobbies = [...data.hobbies, hobbyName];
      // Use our debounced function to update the user
      debouncedUpdateUser(dispatch, {
        id: data.id,
        hobbies: updatedHobbies,
      });
    }
  };

  // We must add onDragOver to allow dropping
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

 
  // We'll change the style based on the 'isHighScore' prop
  const nodeClasses = [
    'react-flow__node-default', // Base React Flow style
    'shadow-xl rounded-lg w-48 transition-all ease-in-out',
    'bg-zinc-800/80 backdrop-blur-md',
    isHighScore
      ? 'border-2 border-yellow-400/80 shadow-yellow-400/10' 
      : 'border border-zinc-700/80', 
  ].join(' ');

  return (
    <div className={nodeClasses} onDrop={onDrop} onDragOver={onDragOver}>
      {/* --- Handles for connecting nodes --- */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500"
      />
      
      {/* --- Node Content --- */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold flex items-center">
            {isHighScore && <Star className="w-4 h-4 mr-1 text-yellow-400" />}
            {data.username}
          </span>
          <span className="text-sm text-zinc-400">Age: {data.age}</span>
        </div>
        <div className="text-xs text-zinc-300 space-y-1">
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1.5 text-blue-400" />
            Score: {data.popularityScore}
          </div>
          <div className="flex items-start">
            <Droplet className="w-3 h-3 mr-1.5 text-green-400 mt-0.5" />
            <span className="flex flex-wrap gap-1">
              {data.hobbies.length > 0
                ? data.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="bg-green-800/50 text-green-300 px-1.5 py-0.5 rounded-full"
                    >
                      {hobby}
                    </span>
                  ))
                : <span className="text-zinc-500 italic">No hobbies</span>}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500"
      />
    </div>
  );
};


export const HighScoreNode = memo((props: NodeProps<User>) => (
  <UserNode data={props.data} isHighScore={true} />
));

export const LowScoreNode = memo((props: NodeProps<User>) => (
  <UserNode data={props.data} isHighScore={false} />
));