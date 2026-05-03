import mongoose, { Schema } from 'mongoose';

// ─── User ───────────────────────────────────────────────
const UserSchema = new Schema({
  name:       { type: String, required: true },
  gender:     { type: String, default: 'Male' },
  gmail:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  avatarSeed: { type: Number, default: 1 },
  role:       { type: String, default: 'user' },
  types:      { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ─── Room ───────────────────────────────────────────────
const RoomMemberSchema = new Schema({
  name:       String,
  avatarSeed: Number,
  gmail:      String,
  role:       String,
}, { _id: false });

const MatchedGroupSchema = new Schema({
  id:       Number,
  name:     String,
  members:  [RoomMemberSchema],
  leaderId: String,
}, { _id: false });

const RoomSchema = new Schema({
  roomId:         { type: String, required: true, unique: true },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  totalMembers:   { type: Number, required: true },
  groupSize:      { type: Number, required: true },
  template:       { type: String, default: 'PROGRAMMING' },
  hostName:       { type: String, required: true },
  hostAvatarSeed: { type: Number, default: 0 },
  members:        { type: [RoomMemberSchema], default: [] },
  readyUsers:     { type: [String], default: [] },
  matchDone:      { type: Boolean, default: false },
  matchedGroups:  { type: [MatchedGroupSchema], default: [] },
  votes:          { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

// ─── Message ─────────────────────────────────────────────
const MessageSchema = new Schema({
  roomId:     { type: String, required: true },
  groupId:    { type: Number, required: true },
  sender:     { type: String, required: true },
  text:       { type: String, required: true },
  time:       { type: String, required: true },
  avatarSeed: { type: Number, default: 0 },
}, { timestamps: true });

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
