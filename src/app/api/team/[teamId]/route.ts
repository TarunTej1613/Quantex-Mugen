import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { Payment } from "@/models/Payment";
import { RegistrationReservation } from "@/models/RegistrationReservation";
import { PaymentSettings, RegistrationSettings } from "@/models/Settings";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await context.params;
    await connectToDatabase();

    const now = new Date();
    // Auto-expire outdated reservations
    await RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    );

    const team = await Team.findOne({ teamId });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const payment = await Payment.findOne({ teamId });

    // Fetch reservation associated with this team
    let reservation = null;
    if (team.reservationId) {
      reservation = await RegistrationReservation.findOne({ reservationId: team.reservationId });
    }
    if (!reservation) {
      reservation = await RegistrationReservation.findOne({ teamId: team.teamId }).sort({ createdAt: -1 });
    }

    // Payment settings
    let paymentSettings = await PaymentSettings.findById("DEFAULT_PAYMENT_SETTINGS");
    const defaultUpiId = paymentSettings?.upiId || "owaspkare@icici";
    const defaultQrUrl = paymentSettings?.paymentQrUrl || "/assets/payment-qr.png";
    const defaultParticipantFee = paymentSettings?.participantFee || 350;
    const defaultTeamFee = paymentSettings?.teamFee || 1400;

    let regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS");
    const participantFee = regSettings?.participantFee || defaultParticipantFee;
    const teamFee = regSettings ? regSettings.participantFee * regSettings.teamSize : defaultTeamFee;

    let secondsRemaining = 0;
    let isExpired = false;

    if (team.paymentStatus === "UNPAID") {
      if (!reservation || reservation.status === "EXPIRED" || (reservation.expiresAt && new Date(reservation.expiresAt) <= now)) {
        isExpired = true;
        secondsRemaining = 0;
      } else if (reservation.status === "ACTIVE") {
        secondsRemaining = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - now.getTime()) / 1000));
        if (secondsRemaining <= 0) {
          isExpired = true;
          reservation.status = "EXPIRED";
          reservation.releasedAt = now;
          await reservation.save();
        }
      }
    }

    return NextResponse.json({
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        teamLeadEmail: team.teamLeadEmail,
        members: team.members,
        paymentStatus: team.paymentStatus,
        reservationId: team.reservationId,
        createdAt: team.createdAt,
        payment: payment
          ? {
              utr: payment.utr,
              amount: payment.amount,
              paymentStatus: payment.paymentStatus,
              screenshotUrl: payment.screenshotUrl,
              screenshotPublicId: payment.screenshotPublicId,
              rejectionReason: payment.rejectionReason,
            }
          : null,
      },
      reservation: reservation
        ? {
            reservationId: reservation.reservationId,
            status: reservation.status,
            expiresAt: reservation.expiresAt,
            releasedAt: reservation.releasedAt,
          }
        : null,
      serverTime: now.toISOString(),
      expiresAt: reservation?.expiresAt ? reservation.expiresAt.toISOString() : null,
      secondsRemaining,
      isExpired,
      paymentSettings: {
        upiId: defaultUpiId,
        paymentQrUrl: defaultQrUrl,
        participantFee,
        teamFee,
      },
    });
  } catch (error: any) {
    console.error("Fetch team error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team details" },
      { status: 500 }
    );
  }
}
