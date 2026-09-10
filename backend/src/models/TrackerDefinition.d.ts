import mongoose, { Document } from 'mongoose';
export interface IFieldDefinition {
    fieldKey: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}
export interface ITrackerDefinition extends Document {
    name: string;
    category: string;
    description?: string;
    fields: IFieldDefinition[];
    ownerId: mongoose.Types.ObjectId;
    isTemplate: boolean;
}
export declare const TrackerDefinition: mongoose.Model<ITrackerDefinition, {}, {}, {}, Document<unknown, {}, ITrackerDefinition, {}, mongoose.DefaultSchemaOptions> & ITrackerDefinition & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITrackerDefinition>;
//# sourceMappingURL=TrackerDefinition.d.ts.map