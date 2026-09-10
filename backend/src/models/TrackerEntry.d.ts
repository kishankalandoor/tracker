import mongoose, { Document } from 'mongoose';
export interface ITrackerEntry extends Document {
    trackerId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    date: Date;
    data: Record<string, any>;
}
export declare const TrackerEntry: mongoose.Model<ITrackerEntry, {}, {}, {}, Document<unknown, {}, ITrackerEntry, {}, mongoose.DefaultSchemaOptions> & ITrackerEntry & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITrackerEntry>;
//# sourceMappingURL=TrackerEntry.d.ts.map