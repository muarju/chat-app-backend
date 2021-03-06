import mongoose from 'mongoose';
import MessageSchema from '../message/schema.js';

const RoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    chatHistory: { type: [MessageSchema], required: true }
})

export default RoomSchema