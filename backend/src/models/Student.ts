import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  name: string;
  registrationNumber: string;
  generatedCollegeEmail: string;
  department: "CSE" | "ECE" | "IT" | "EEE" | "MECH" | "CIVIL" | "BIO" | "Others";
  year: "II" | "III" | "IV";
  section: string;
  mobile: string;
  gender: "Male" | "Female";
  accommodation: "Day Scholar" | "Hosteller";
  hostel?: string;
  roomNumber?: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const StudentSchema = new Schema<IStudent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    generatedCollegeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["CSE", "ECE", "IT", "EEE", "MECH", "CIVIL", "BIO", "Others"],
    },
    year: {
      type: String,
      required: true,
      enum: ["II", "III", "IV"],
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female"],
    },
    accommodation: {
      type: String,
      required: true,
      enum: ["Day Scholar", "Hosteller"],
    },
    hostel: {
      type: String,
      default: null,
    },
    roomNumber: {
      type: String,
      default: null,
    },
    teamId: {
      type: String,
      index: true,
      ref: "Team",
    },
  },
  {
    timestamps: true,
  }
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
