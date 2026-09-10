import mongoose, { Document, Schema } from 'mongoose';

export type BlockType = 'text' | 'task' | 'checklist' | 'note' | 'schedule';

export interface IPlannerTask {
  text: string;
  isCompleted: boolean;
}

export interface IPlannerBlock {
  id: string;
  type: BlockType;
  // For 'text' | 'note': data.content (string)
  // For 'task': data.tasks (IPlannerTask[])
  // For 'checklist': data.items (IPlannerTask[])
  // For 'schedule': data.timeSlots ([{time, label, done}])
  data: Record<string, any>;
}

export interface IPlannerContent {
  blocks: IPlannerBlock[];
}

export interface IPlanner extends Document {
  ownerId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  emoji: string;
  content: IPlannerContent;
  reminderAt?: Date | null;
  reminderNote?: string;
  isCompleted: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlannerTaskSchema = new Schema<IPlannerTask>(
  {
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlannerBlockSchema = new Schema<IPlannerBlock>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'task', 'checklist', 'note', 'schedule'],
    },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PlannerContentSchema = new Schema<IPlannerContent>(
  {
    blocks: { type: [PlannerBlockSchema], default: [] },
  },
  { _id: false }
);

const PlannerSchema = new Schema<IPlanner>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'TrackerDefinition' },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    emoji: { type: String, default: '📋' },
    content: { type: PlannerContentSchema, default: () => ({ blocks: [] }) },
    reminderAt: { type: Date, default: null },
    reminderNote: { type: String },
    isCompleted: { type: Boolean, default: false },
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient user queries sorted by recency
PlannerSchema.index({ ownerId: 1, updatedAt: -1 });

export const Planner = mongoose.model<IPlanner>('Planner', PlannerSchema);
