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

export const DEFAULT_RULES = [
  {
    order: 1,
    badge: "RULE 1",
    title: "DOMAIN RESTRICTION",
    highlight: "@klu.ac.in REQUIRED",
    description: "Only official KLU student emails ending with @klu.ac.in are authorized to register.",
    points: [],
    iconName: "ShieldCheck",
    accentColor: "rose",
    isEnabled: true,
  },
  {
    order: 2,
    badge: "RULE 2",
    title: "STRICTLY 4 MEMBERS",
    highlight: "EXACTLY 4 MEMBERS",
    description: "Every team must register exactly 4 members. Partial team entries or individual entries will not be accepted.",
    points: [],
    iconName: "Users",
    accentColor: "cyan",
    isEnabled: true,
  },
  {
    order: 3,
    badge: "RULE 3",
    title: "5-MIN PAYMENT SLOT",
    highlight: "5-MINUTE TIMER LOCK",
    description: "Upon starting registration, a 5-minute temporary seat reservation is locked while payment verification is completed.",
    points: [],
    iconName: "CreditCard",
    accentColor: "amber",
    isEnabled: true,
  },
];
