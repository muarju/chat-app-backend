import RoomSchema from './schema.js';
import mongoose from 'mongoose';

const RoomModel = mongoose.model("rooms", RoomSchema);
export default RoomModel;