import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { Team } from "../models/Team";
import { Payment } from "../models/Payment";
import { RegistrationReservation } from "../models/RegistrationReservation";

export const submitPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { teamId, utr, screenshotUrl, amount } = req.body;

    if (!teamId || !utr || !screenshotUrl) {
      return res.status(400).json({
        error: "Team ID, 12-digit UTR, and payment screenshot are required.",
      });
    }

    const cleanUtr = utr.toString().trim();
    if (!/^[0-9]{12}$/.test(cleanUtr)) {
      return res.status(400).json({
        error: "UTR must be exactly 12 numeric digits.",
      });
    }

    const existingPayment = await Payment.findOne({ utr: cleanUtr });
    if (existingPayment) {
      return res.status(400).json({
        error: "This UTR has already been submitted for another transaction.",
      });
    }

    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({ error: "Team not found." });
    }

    const payment = await Payment.create({
      teamId,
      amount: amount || 1400,
      utr: cleanUtr,
      screenshotUrl,
      paymentStatus: "PENDING",
    });

    team.paymentStatus = "PENDING";
    team.paymentId = payment._id as any;
    await team.save();

    if (team.reservationId) {
      await RegistrationReservation.findOneAndUpdate(
        { reservationId: team.reservationId },
        { status: "CONVERTED" }
      );
    }

    return res.json({
      success: true,
      teamId,
      paymentStatus: "PENDING",
      message: "Payment submitted successfully. Awaiting verification.",
    });
  } catch (error: any) {
    console.error("Payment submit error:", error);
    return res.status(500).json({ error: error.message });
  }
};
