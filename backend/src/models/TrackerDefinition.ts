import mongoose, { Document, Schema } from 'mongoose';

export interface IFieldDefinition {
  fieldKey: string;
  label: string;
  type: string; // text, number, boolean, date, duration, rating, currency, etc.
  required: boolean;
  options?: string[]; // for select/multiselect
}

export interface ITrackerDefinition extends Document {
  name: string;
  category: string; // Health, Finance, Study, Work, etc.
  description?: string;
  fields: IFieldDefinition[];
  ownerId: mongoose.Types.ObjectId;
  isTemplate: boolean;
}

const fieldDefinitionSchema = new Schema<IFieldDefinition>({
  fieldKey: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
}, { _id: false });

const trackerDefinitionSchema = new Schema<ITrackerDefinition>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    fields: [fieldDefinitionSchema],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTemplate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TrackerDefinition = mongoose.model<ITrackerDefinition>('TrackerDefinition', trackerDefinitionSchema);
