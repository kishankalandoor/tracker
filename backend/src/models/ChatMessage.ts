import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  executedAction?: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  executedAction: { type: String },
}, { timestamps: true });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
