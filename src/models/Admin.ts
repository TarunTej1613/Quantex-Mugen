import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "ADMIN" | "VERIFIER" | "VIEWER";
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "VERIFIER", "VIEWER"],
      default: "ADMIN",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
