import mongoose, { Schema, Document, Model } from 'mongoose';
// We are using uuid@8, which is CJS
import { v4 as uuidv4 } from 'uuid'; 

// --- TypeScript Interface ---
export interface IUser extends Document {
  _id: string;
  username: string;
  age: number;
  hobbies: string[];
  friends: string[];
  createdAt: Date;
  
  // This is a computed property
  popularityScore: number; 

  // --- Instance Methods ---
  calculatePopularityScore(allUsers?: IUser[]): Promise<number>;
  isFriendWith(userId: string): boolean;
}

// --- Mongoose Schema ---
const UserSchema: Schema<IUser> = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
      index: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [13, 'User must be at least 13 years old'],
    },
    hobbies: {
      type: [String],
      default: [],
    },
    friends: {
      type: [String],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
    
    // --- THIS IS THE FIX ---
    // We create a single transform function
    // and apply it to *both* toJSON and toObject
    
    transform: (doc: any, ret: any) => {
      ret.id = ret._id; // Create 'id'
      delete ret._id;   // Delete '_id'
      delete ret.__v;   // Delete '__v'
    },
    
    toJSON: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    
    toObject: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    // --- END OF FIX ---
  }
);

// --- Business Logic (Methods) ---

UserSchema.methods.calculatePopularityScore = async function(allUsers?: IUser[]): Promise<number> {
  const user = this as IUser;
  const numFriends = user.friends.length;
  let sharedHobbiesCount = 0;

  const usersToCompare = allUsers || await mongoose.model<IUser>('User').find({
    _id: { $in: user.friends },
  });

  const friends = usersToCompare.filter(u => user.friends.includes(u._id));

  for (const friend of friends) {
    const shared = user.hobbies.filter(hobby => friend.hobbies.includes(hobby));
    sharedHobbiesCount += shared.length;
  }

  const score = numFriends + (sharedHobbiesCount * 0.5);
  return score;
};

UserSchema.methods.isFriendWith = function(userId: string): boolean {
  return (this as IUser).friends.includes(userId);
};

// --- Model Creation ---
const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default UserModel;