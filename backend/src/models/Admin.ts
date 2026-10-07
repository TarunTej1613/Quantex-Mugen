import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  email?: string;
  name: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "ADMIN" | "VERIFIER" | "VIEWER";
  isActive: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, trim: true },
    name: { type: String, default: "Admin", trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "VERIFIER", "VIEWER"],
      default: "ADMIN",
    },
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    lastLogin: { type: Date },
    lastLoginIp: { type: String },
    lastLoginDevice: { type: String },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

