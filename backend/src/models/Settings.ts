import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistrationSettings {
  _id: string;
  maximumTeams: number;
  registrationOpen: boolean;
  participantFee: number;
  teamSize: number;
  eventName: string;
  tagline: string;
  eventDate: string;
  venue: string;
  prizePool: string;
  credits: string;
  whatsappLink: string;
}

const RegistrationSettingsSchema = new Schema<IRegistrationSettings>(
  {
    _id: { type: String, default: "DEFAULT_REG_SETTINGS" },
    maximumTeams: { type: Number, default: 100 },
    registrationOpen: { type: Boolean, default: true },
    participantFee: { type: Number, default: 350 },
    teamSize: { type: Number, default: 4 },
    eventName: { type: String, default: "QUANTEX MUGEN" },
    tagline: { type: String, default: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN" },
    eventDate: { type: String, default: "30–31 October" },
    venue: { type: String, default: "KS Auditorium" },
    prizePool: { type: String, default: "₹15,000" },
    credits: { type: String, default: "2EE Credits" },
    whatsappLink: { type: String, default: "https://chat.whatsapp.com/quantex-mugen" },
  },
  { timestamps: true }
);

export const RegistrationSettings: Model<IRegistrationSettings> =
  mongoose.models.RegistrationSettings ||
  mongoose.model<IRegistrationSettings>("RegistrationSettings", RegistrationSettingsSchema);

export interface IPaymentSettings {
  _id: string;
  upiId: string;
  paymentQrUrl: string;
  participantFee: number;
  teamFee: number;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    _id: { type: String, default: "DEFAULT_PAYMENT_SETTINGS" },
    upiId: { type: String, default: "owaspkare@icici" },
    paymentQrUrl: { type: String, default: "/assets/payment-qr.png" },
    participantFee: { type: Number, default: 350 },
    teamFee: { type: Number, default: 1400 },
  },
  { timestamps: true }
);

export const PaymentSettings: Model<IPaymentSettings> =
  mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettings>("PaymentSettings", PaymentSettingsSchema);

export interface IEventSettings {
  _id: string;
  eventName: string;
  tagline: string;
  eventDate: string;
  venue: string;
  prizePool: string;
  registrationFee: number;
  credits: string;
  contactEmail: string;
  coordinators: string;
}

const EventSettingsSchema = new Schema<IEventSettings>(
  {
    _id: { type: String, default: "DEFAULT_EVENT_SETTINGS" },
    eventName: { type: String, default: "QUANTEX MUGEN" },
    tagline: { type: String, default: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN" },
    eventDate: { type: String, default: "October 30 – 31" },
    venue: { type: String, default: "KS Auditorium" },
    prizePool: { type: String, default: "₹15,000" },
    registrationFee: { type: Number, default: 350 },
    credits: { type: String, default: "2EE Credits" },
    contactEmail: { type: String, default: "owaspkare@klu.ac.in" },
    coordinators: { type: String, default: "OWASP & Cybernerds Student Chapters" },
  },
  { timestamps: true }
);

export const EventSettings: Model<IEventSettings> =
  mongoose.models.EventSettings ||
  mongoose.model<IEventSettings>("EventSettings", EventSettingsSchema);

