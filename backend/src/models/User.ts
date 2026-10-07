import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string; // Official KLU Email (@klu.ac.in)
  password?: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  teamId?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return v.endsWith("@klu.ac.in");
        },
        message: "Only @klu.ac.in email addresses are permitted.",
      },
    },
    password: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["STUDENT", "ADMIN"],
      default: "STUDENT",
    },
    teamId: {
      type: String,
      default: null,
      ref: "Team",
    },
    googleId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
