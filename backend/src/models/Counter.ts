import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter {
  _id: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

export const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

export async function getNextTeamId(): Promise<string> {
  const counter: any = await Counter.findByIdAndUpdate(
    "QUANTEX_MUGEN",
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  
  const seq = counter?.sequence || 1;
  const formattedSeq = String(seq).padStart(3, "0");
  return `QXM-${formattedSeq}`;
}
