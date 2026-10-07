import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistrationReservation extends Document {
  reservationId: string;
  teamId?: string;
  userId: string;
  status: "ACTIVE" | "EXPIRED" | "CONVERTED" | "CANCELLED";
  expiresAt: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationReservationSchema = new Schema<IRegistrationReservation>(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    teamId: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CONVERTED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL or query helper for active capacity
RegistrationReservationSchema.index({ status: 1, expiresAt: 1 });

export const RegistrationReservation: Model<IRegistrationReservation> =
  mongoose.models.RegistrationReservation ||
  mongoose.model<IRegistrationReservation>(
    "RegistrationReservation",
    RegistrationReservationSchema
  );
