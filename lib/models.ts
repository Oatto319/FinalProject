import mongoose, { Schema } from 'mongoose';

// ─── User ───────────────────────────────────────────────
const UserSchema = new Schema({
  name:       { type: String, required: true },
  gender:     { type: String, default: 'Male' },
  gmail:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  avatarSeed: { type: Number, default: 1 },
  avatarImage: { type: String, default: null },
  role:       { type: String, default: 'user' },
  types:      { type: Schema.Types.Mixed, default: {} },
  sessionToken: { type: String, default: null, index: true },
}, { timestamps: true });

UserSchema.index({ name: 1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ─── Room ───────────────────────────────────────────────
const RoomMemberSchema = new Schema({
  name:       String,
  avatarSeed: Number,
  avatarImage: { type: String, default: null },
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
  hostGmail:      { type: String, default: '' },
  hostAvatarSeed: { type: Number, default: 0 },
  hostAvatarImage: { type: String, default: null },
  members:        { type: [RoomMemberSchema], default: [] },
  readyUsers:     { type: [String], default: [] },
  matchDone:      { type: Boolean, default: false },
  matchMode:      { type: String, default: 'auto' },
  typeComposition: { type: Schema.Types.Mixed, default: {} },
  matchedGroups:  { type: [MatchedGroupSchema], default: [] },
  votes:          { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

RoomSchema.index({ roomId: 1 });
RoomSchema.index({ hostName: 1 });
RoomSchema.index({ 'members.gmail': 1 });
RoomSchema.index({ 'members.name': 1 });

export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

// ─── Message ─────────────────────────────────────────────
const MessageSchema = new Schema({
  roomId:     { type: String, required: true },
  groupId:    { type: Number, required: true },
  sender:     { type: String, required: true },
  text:       { type: String, required: true },
  time:       { type: String, required: true },
  avatarSeed: { type: Number, default: 0 },
  avatarImage: { type: String, default: null },
}, { timestamps: true });

MessageSchema.index({ roomId: 1, groupId: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
