import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  teamId: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "Team",
    },
    amount: {
      type: Number,
      required: true,
      default: 1400,
    },
    utr: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[0-9]{12}$/, "UTR must be exactly 12 digits numeric."],
      index: true,
    },
    screenshotUrl: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
