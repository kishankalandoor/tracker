import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  ownerId: mongoose.Types.ObjectId;
  plannerId?: mongoose.Types.ObjectId;
  title: string;
  reminderAt: Date;
  isAcknowledged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plannerId: { type: Schema.Types.ObjectId, ref: 'Planner' },
    title: { type: String, required: true, trim: true },
    reminderAt: { type: Date, required: true },
    isAcknowledged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Efficient query: upcoming, unacknowledged reminders for a user
ReminderSchema.index({ ownerId: 1, reminderAt: 1, isAcknowledged: 1 });

export const Reminder = mongoose.model<IReminder>('Reminder', ReminderSchema);
