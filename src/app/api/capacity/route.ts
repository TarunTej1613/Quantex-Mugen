import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { RegistrationReservation } from "@/models/RegistrationReservation";
import { RegistrationSettings, PaymentSettings } from "@/models/Settings";

export async function GET() {
  try {
    await connectToDatabase();

    // Auto-expire outdated reservations
    const now = new Date();
    await RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    );

    // Get settings
    let regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS");
    if (!regSettings) {
      regSettings = await RegistrationSettings.create({
        _id: "DEFAULT_REG_SETTINGS",
        maximumTeams: 100,
        registrationOpen: true,
        participantFee: 350,
        teamSize: 4,
        eventName: "QUANTEX MUGEN",
        tagline: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN",
        eventDate: "30–31 October",
        venue: "KS Auditorium",
        prizePool: "₹15,000",
        credits: "2EE Credits",
        whatsappLink: "https://chat.whatsapp.com/quantex-mugen",
      });
    }

    let paymentSettings = await PaymentSettings.findById("DEFAULT_PAYMENT_SETTINGS");
    if (!paymentSettings) {
      paymentSettings = await PaymentSettings.create({
        _id: "DEFAULT_PAYMENT_SETTINGS",
        upiId: "owaspkare@icici",
        paymentQrUrl: "/assets/payment-qr.png",
        participantFee: 350,
        teamFee: 1400,
      });
    }

    // Count confirmed / active teams (paymentStatus != REJECTED)
    const confirmedTeams = await Team.countDocuments({
      paymentStatus: { $in: ["PENDING", "VERIFIED"] },
    });

    // Count active reservations
    const activeReservations = await RegistrationReservation.countDocuments({
      status: "ACTIVE",
      expiresAt: { $gt: now },
    });

    const occupiedSlots = confirmedTeams + activeReservations;
    const isFull = occupiedSlots >= regSettings.maximumTeams;

    return NextResponse.json({
      totalTeams: confirmedTeams,
      maximumTeams: regSettings.maximumTeams,
      confirmedTeams,
      activeReservations,
      occupiedSlots,
      isFull,
      participantFee: regSettings.participantFee,
      teamFee: regSettings.participantFee * regSettings.teamSize,
      registrationOpen: regSettings.registrationOpen && !isFull,
      eventName: regSettings.eventName,
      tagline: regSettings.tagline,
      eventDate: regSettings.eventDate,
      venue: regSettings.venue,
      prizePool: regSettings.prizePool,
      credits: regSettings.credits,
    });
  } catch (error) {
    console.error("Capacity API error:", error);
    // Fallback response if DB is initializing
    return NextResponse.json({
      totalTeams: 0,
      maximumTeams: 100,
      confirmedTeams: 0,
      activeReservations: 0,
      occupiedSlots: 0,
      isFull: false,
      participantFee: 350,
      teamFee: 1400,
      registrationOpen: true,
      eventName: "QUANTEX MUGEN",
      tagline: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN",
      eventDate: "30–31 October",
      venue: "KS Auditorium",
      prizePool: "₹15,000",
      credits: "2EE Credits",
    });
  }
}
