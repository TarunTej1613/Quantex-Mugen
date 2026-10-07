import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { Team } from "@/models/Team";
import { Payment } from "@/models/Payment";
import { RegistrationReservation } from "@/models/RegistrationReservation";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const { teamId, utr, screenshotUrl, screenshotPublicId, amount } = await req.json();

    if (!teamId || !utr || !screenshotUrl) {
      return NextResponse.json(
        { error: "Team ID, 12-digit UTR, and payment screenshot are required." },
        { status: 400 }
      );
    }

    // Exact 12 digits UTR validation
    const cleanUtr = utr.toString().trim();
    if (!/^[0-9]{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { error: "UTR must be exactly 12 numeric digits (no spaces, letters, or special characters)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const now = new Date();

    // Verify team exists
    const team = await Team.findOne({ teamId });
    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 }
      );
    }

    // Check if team is already submitted / confirmed
    if (team.paymentStatus === "PENDING" || team.paymentStatus === "VERIFIED") {
      return NextResponse.json({
        success: true,
        teamId,
        paymentStatus: team.paymentStatus,
        message: "Payment has already been submitted for this team.",
      });
    }

    // Strict Server-Side 5-Minute Reservation Expiry Check
    let reservation = null;
    if (team.reservationId) {
      reservation = await RegistrationReservation.findOne({ reservationId: team.reservationId });
    }
    if (!reservation) {
      reservation = await RegistrationReservation.findOne({ teamId }).sort({ createdAt: -1 });
    }

    if (
      !reservation ||
      reservation.status === "EXPIRED" ||
      reservation.status === "CANCELLED" ||
      (reservation.expiresAt && new Date(reservation.expiresAt).getTime() <= now.getTime())
    ) {
      if (reservation && reservation.status === "ACTIVE") {
        reservation.status = "EXPIRED";
        reservation.releasedAt = now;
        await reservation.save();
      }

      return NextResponse.json(
        {
          error: "Your 5-minute payment window has expired. Your registration slot has been released. Please start the registration process again.",
          expired: true,
        },
        { status: 400 }
      );
    }

    // Check if UTR is already used
    const existingPayment = await Payment.findOne({ utr: cleanUtr });
    if (existingPayment) {
      return NextResponse.json(
        { error: "This UTR has already been submitted for another transaction." },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await Payment.create({
      teamId,
      amount: amount || 1400,
      utr: cleanUtr,
      screenshotUrl,
      screenshotPublicId: screenshotPublicId || null,
      paymentStatus: "PENDING",
    });

    // Update team status and link payment
    team.paymentStatus = "PENDING";
    team.paymentId = payment._id as any;
    await team.save();

    // Convert active reservation to CONVERTED (locks the slot permanently)
    reservation.status = "CONVERTED";
    await reservation.save();

    return NextResponse.json({
      success: true,
      teamId,
      paymentStatus: "PENDING",
      message: "Payment submitted successfully. Awaiting Admin verification.",
    });
  } catch (error: any) {
    console.error("Payment submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment submission" },
      { status: 500 }
    );
  }
}
