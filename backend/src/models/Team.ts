import mongoose, { Schema, Document, Model } from "mongoose";
import { IStudent, StudentSchema } from "./Student";

export interface ITeam extends Document {
  teamId: string;
  teamName: string;
  teamLeadId: mongoose.Types.ObjectId | string;
  teamLeadEmail: string;
  members: IStudent[];
  paymentStatus: "UNPAID" | "PENDING" | "VERIFIED" | "REJECTED";
  paymentId?: mongoose.Types.ObjectId | string;
  reservationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    teamLeadId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamLeadEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    members: {
      type: [StudentSchema],
      validate: {
        validator: function (val: IStudent[]) {
          return val.length === 4;
        },
        message: "Every team must have exactly 4 members.",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "VERIFIED", "REJECTED"],
      default: "UNPAID",
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    reservationId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
