export interface TrackerField {
  fieldKey: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface TrackerDefinition {
  _id: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  fields: TrackerField[];
  isTemplate: boolean;
  createdAt: string;
}

export interface RoutineTask {
  _id?: string;
  taskName: string;
  estimatedMinutes: number;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
  aiNotes?: string;
}

export interface Routine {
  _id: string;
  ownerId: string;
  title: string;
  tasks: RoutineTask[];
  createdAt: string;
}

// ── Planner Types ────────────────────────────────

export type BlockType = 'text' | 'task' | 'checklist' | 'note' | 'schedule';

export interface PlannerTaskItem {
  text: string;
  isCompleted: boolean;
}

export interface PlannerBlock {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

export interface PlannerContent {
  blocks: PlannerBlock[];
}

export interface Planner {
  _id: string;
  ownerId: string;
  templateId?: string;
  title: string;
  description?: string;
  emoji: string;
  content: PlannerContent;
  reminderAt?: string | null;
  reminderNote?: string;
  isCompleted: boolean;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Reminder Types ───────────────────────────────

export interface Reminder {
  _id: string;
  ownerId: string;
  plannerId?: string;
  title: string;
  reminderAt: string;
  isAcknowledged: boolean;
  createdAt: string;
}
