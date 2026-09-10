import mongoose, { Document, Schema } from 'mongoose';

export interface ITrackerEntry extends Document {
  trackerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  data: Record<string, any>;
}

const trackerEntrySchema = new Schema<ITrackerEntry>(
  {
    trackerId: { type: Schema.Types.ObjectId, ref: 'TrackerDefinition', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Optimize for common query patterns
trackerEntrySchema.index({ trackerId: 1, userId: 1, date: -1 });

export const TrackerEntry = mongoose.model<ITrackerEntry>('TrackerEntry', trackerEntrySchema);
