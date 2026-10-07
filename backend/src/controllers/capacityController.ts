import { Request, Response } from "express";
import { Team } from "../models/Team";
import { RegistrationReservation } from "../models/RegistrationReservation";
import { RegistrationSettings } from "../models/Settings";

// In-memory micro-cache for 500+ concurrent users (3-second TTL)
let cachedCapacityData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3000;

export const invalidateCapacityCache = () => {
  lastCacheTime = 0;
  cachedCapacityData = null;
};

export const getCapacity = async (req: Request, res: Response) => {
  try {
    const nowTime = Date.now();
    if (cachedCapacityData && nowTime - lastCacheTime < CACHE_TTL_MS) {
      return res.json(cachedCapacityData);
    }

    const now = new Date();
    // Auto-expire outdated reservations asynchronously
    RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    ).exec().catch(() => {});

    let regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS").lean();
    if (!regSettings) {
      regSettings = (await RegistrationSettings.create({
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
      })).toObject();
    }

    const [confirmedTeams, activeReservations] = await Promise.all([
      Team.countDocuments({
        paymentStatus: { $in: ["PENDING", "VERIFIED"] },
      }),
      RegistrationReservation.countDocuments({
        status: "ACTIVE",
        expiresAt: { $gt: now },
      }),
    ]);

    const occupiedSlots = confirmedTeams + activeReservations;
    const isFull = occupiedSlots >= regSettings.maximumTeams;

    cachedCapacityData = {
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
    };
    lastCacheTime = nowTime;

    return res.json(cachedCapacityData);
  } catch (error: any) {
    console.error("Capacity controller error:", error);
    if (cachedCapacityData) {
      return res.json(cachedCapacityData);
    }
    return res.status(500).json({ error: error.message });
  }
};
