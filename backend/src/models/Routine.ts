import mongoose, { Document, Schema } from 'mongoose';

export interface IRoutineTask {
  taskName: string;
  estimatedMinutes: number;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
  aiNotes?: string;
}

export interface IRoutine extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  tasks: IRoutineTask[];
  createdAt: Date;
}

const RoutineTaskSchema = new Schema<IRoutineTask>({
  taskName: { type: String, required: true },
  estimatedMinutes: { type: Number, required: true, default: 15 },
  startTime: { type: String },
  endTime: { type: String },
  isCompleted: { type: Boolean, default: false },
  aiNotes: { type: String }
});

const RoutineSchema = new Schema<IRoutine>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  tasks: [RoutineTaskSchema]
}, { timestamps: true });

export const Routine = mongoose.model<IRoutine>('Routine', RoutineSchema);
