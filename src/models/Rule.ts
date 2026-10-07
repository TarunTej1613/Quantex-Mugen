import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRule extends Document {
  order: number;
  badge: string;
  title: string;
  highlight?: string;
  description: string;
  points?: string[];
  iconName: string;
  accentColor: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    order: { type: Number, required: true, default: 1, index: true },
    badge: { type: String, default: "RULE" },
    title: { type: String, required: true, trim: true },
    highlight: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    points: [{ type: String, trim: true }],
    iconName: { type: String, default: "ShieldCheck" },
    accentColor: { type: String, default: "rose" },
    isEnabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Rule: Model<IRule> =
  mongoose.models.Rule || mongoose.model<IRule>("Rule", RuleSchema);

export { DEFAULT_RULES } from "@/constants/rules";
