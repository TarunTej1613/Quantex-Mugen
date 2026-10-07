import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { Team } from "../models/Team";
import { Student } from "../models/Student";
import { RegistrationReservation } from "../models/RegistrationReservation";
import { RegistrationSettings, PaymentSettings } from "../models/Settings";
import { getNextTeamId } from "../models/Counter";
import { User } from "../models/User";
import { Payment } from "../models/Payment";

export const registerTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { teamName, members } = req.body;

    if (!teamName || typeof teamName !== "string" || teamName.trim().length < 3) {
      return res.status(400).json({ error: "Team name must be at least 3 characters." });
    }

    if (!members || !Array.isArray(members) || members.length !== 4) {
      return res.status(400).json({ error: "Every team must have exactly 4 participants." });
    }

    const now = new Date();
    await RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    );

    const regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS");
    const maxTeams = regSettings?.maximumTeams || 100;
    const isRegOpen = regSettings ? regSettings.registrationOpen : true;

    if (!isRegOpen) {
      return res.status(400).json({ error: "Registration is currently closed." });
    }

    const confirmedCount = await Team.countDocuments({
      paymentStatus: { $in: ["PENDING", "VERIFIED"] },
    });
    const activeResCount = await RegistrationReservation.countDocuments({
      status: "ACTIVE",
      expiresAt: { $gt: now },
      userId: { $ne: req.user.userId },
    });

    if (confirmedCount + activeResCount >= maxTeams) {
      return res.status(400).json({ error: "Registrations are full for Quantex Mugen." });
    }

    // Uniqueness (Strictly in BLOCK LETTERS uppercase)
    const normalizedTeamName = teamName.trim().toUpperCase();
    const safeRegex = new RegExp(`^${normalizedTeamName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const existingTeam = await Team.findOne({
      teamName: safeRegex,
    });

    if (existingTeam) {
      return res.status(400).json({
        error: `Team name "${normalizedTeamName}" is already taken. Please choose a different name.`,
      });
    }

    // Validate 4 members
    const regNumbersSet = new Set<string>();
    const formattedMembers = [];

    for (let i = 0; i < 4; i++) {
      const m = members[i];
      if (!m.name || !m.registrationNumber || !m.department || !m.year || !m.section || !m.mobile || !m.gender || !m.accommodation) {
        return res.status(400).json({ error: `Participant #${i + 1} has incomplete fields.` });
      }

      const regNo = m.registrationNumber.trim().toUpperCase();
      if (regNumbersSet.has(regNo)) {
        return res.status(400).json({ error: `Duplicate registration number "${regNo}" within team.` });
      }
      regNumbersSet.add(regNo);

      const existingStudent = await Student.findOne({ registrationNumber: regNo });
      if (existingStudent) {
        return res.status(400).json({
          error: `Student "${regNo}" is already registered in another team.`,
        });
      }

      if (!/^[0-9]{10}$/.test(m.mobile)) {
        return res.status(400).json({ error: `Participant #${i + 1} mobile must be 10 digits.` });
      }

      formattedMembers.push({
        name: m.name.trim(),
        registrationNumber: regNo,
        generatedCollegeEmail: `${regNo.toLowerCase()}@klu.ac.in`,
        department: m.department,
        year: m.year,
        section: m.section.trim(),
        mobile: m.mobile.trim(),
        gender: m.gender,
        accommodation: m.accommodation,
        hostel: m.accommodation === "Hosteller" ? m.hostel : null,
        roomNumber: m.accommodation === "Hosteller" ? m.roomNumber : null,
      });
    }

    // 5-minute reservation timer
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const reservationId = `RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation = await RegistrationReservation.create({
      reservationId,
      userId: req.user.userId,
      status: "ACTIVE",
      expiresAt,
    });

    const teamId = await getNextTeamId();

    const newTeam = await Team.create({
      teamId,
      teamName: normalizedTeamName,
      teamLeadId: req.user.userId,
      teamLeadEmail: req.user.email,
      members: formattedMembers,
      paymentStatus: "UNPAID",
      reservationId,
    });

    reservation.teamId = teamId;
    await reservation.save();

    for (const member of formattedMembers) {
      await Student.create({ ...member, teamId });
    }

    await User.findByIdAndUpdate(req.user.userId, { teamId });

    return res.json({
      success: true,
      teamId,
      teamName: normalizedTeamName,
      reservationId,
      expiresAt,
    });
  } catch (error: any) {
    console.error("Team registration error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const [payment, reservation, paymentSettingsDoc] = await Promise.all([
      Payment.findOne({ teamId }),
      RegistrationReservation.findOne({
        $or: [{ reservationId: team.reservationId }, { teamId }],
      }),
      PaymentSettings.findById("DEFAULT_PAYMENT_SETTINGS").lean(),
    ]);

    const now = new Date();
    let expiryDate: Date;
    let isExpired = false;

    if (reservation) {
      expiryDate = new Date(reservation.expiresAt);
      isExpired = reservation.status === "EXPIRED" || (reservation.status === "ACTIVE" && now > expiryDate);
    } else {
      // Default to 5 minutes from creation if reservation record was not found
      expiryDate = new Date(new Date(team.createdAt).getTime() + 5 * 60 * 1000);
      isExpired = now > expiryDate;
    }

    return res.json({
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        teamLeadEmail: team.teamLeadEmail,
        members: team.members,
        paymentStatus: team.paymentStatus,
        createdAt: team.createdAt,
        payment: payment
          ? {
              utr: payment.utr,
              amount: payment.amount,
              paymentStatus: payment.paymentStatus,
              screenshotUrl: payment.screenshotUrl,
              rejectionReason: payment.rejectionReason,
            }
          : null,
      },
      expiresAt: expiryDate.toISOString(),
      isExpired: team.paymentStatus === "UNPAID" && isExpired,
      paymentSettings: {
        upiId: paymentSettingsDoc?.upiId || "owaspkare@icici",
        paymentQrUrl: paymentSettingsDoc?.paymentQrUrl || "/assets/payment-qr.png",
        teamFee: paymentSettingsDoc?.teamFee || 1400,
        participantFee: paymentSettingsDoc?.participantFee || 350,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const checkTeamNameAvailability = async (req: Request, res: Response) => {
  try {
    const rawName = (req.query.name || req.body?.name || "").toString().trim();
    if (!rawName) {
      return res.json({ available: false, error: "Team name is required." });
    }

    if (rawName.length < 3) {
      return res.json({ available: false, error: "Team name must be at least 3 characters." });
    }

    const normalizedName = rawName.toUpperCase();
    const safeRegex = new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const existing = await Team.findOne({ teamName: safeRegex }).select("teamId teamName").lean();

    if (existing) {
      return res.json({
        available: false,
        message: `Team name "${normalizedName}" is already taken. Please choose another name.`,
        teamId: (existing as any).teamId,
      });
    }

    return res.json({
      available: true,
      message: `Team name "${normalizedName}" is available!`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
