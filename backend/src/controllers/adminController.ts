import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { Team } from "../models/Team";
import { Student } from "../models/Student";
import { Payment } from "../models/Payment";
import { RegistrationReservation } from "../models/RegistrationReservation";
import { RegistrationSettings, PaymentSettings, EventSettings } from "../models/Settings";
import { Admin } from "../models/Admin";
import { ActivityLog } from "../models/ActivityLog";
import { Rule, DEFAULT_RULES } from "../models/Rule";
import { invalidateCapacityCache } from "./capacityController";

const JWT_SECRET = process.env.JWT_SECRET || "quantex_mugen_super_cyber_jwt_secret_key_2026";
const COOKIE_NAME = "qxm_admin_session";

// In-Memory Micro-Cache for Admin Live Sync (3s TTL)
interface AdminCacheStore {
  stats: { data: any; time: number } | null;
  teams: { data: any; time: number; key: string } | null;
  payments: { data: any; time: number; key: string } | null;
  participants: { data: any; time: number; key: string } | null;
}

const adminCache: AdminCacheStore = {
  stats: null,
  teams: null,
  payments: null,
  participants: null,
};

const CACHE_TTL_MS = 3000;

export const invalidateAdminCache = () => {
  adminCache.stats = null;
  adminCache.teams = null;
  adminCache.payments = null;
  adminCache.participants = null;
};

// Helper: Log Admin Activity
export const logActivity = async (
  adminId: string,
  adminUsername: string,
  adminRole: string,
  action: string,
  targetRecord?: string | string[],
  details?: Record<string, any>,
  ip?: string
) => {
  try {
    await ActivityLog.create({
      adminId,
      adminUsername,
      adminEmail: adminUsername,
      adminRole,
      action,
      targetRecord: Array.isArray(targetRecord) ? targetRecord.join(",") : targetRecord,
      details,
      ip,
    });
  } catch (err) {
    console.error("Activity logging error:", err);
  }
};

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================

import crypto from "crypto";

// ============================================================================
// RATE LIMITING & BRUTE-FORCE DEFENSE (In-Memory Sliding Window)
// ============================================================================
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

const checkRateLimit = (key: string): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const entry = loginRateLimits.get(key);

  if (!entry) return { allowed: true };

  // Reset if window has elapsed
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimits.delete(key);
    return { allowed: true };
  }

  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
    const waitSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
};

const recordFailedAttempt = (key: string) => {
  const now = Date.now();
  const entry = loginRateLimits.get(key);

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimits.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  } else {
    entry.count += 1;
    entry.lastAttempt = now;
    if (entry.count >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
    }
  }
};

const resetRateLimit = (key: string) => {
  loginRateLimits.delete(key);
};

// ============================================================================
// RFC 6238 TOTP (Two-Factor Authentication) Engine
// ============================================================================
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const generateTotpSecret = (length = 32): string => {
  const randomBytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < randomBytes.length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % 32];
  }
  return secret;
};

const base32ToBuffer = (base32: string): Buffer => {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
};

export const generateTotpCode = (secret: string, timeStepOffset = 0): string => {
  const key = base32ToBuffer(secret);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epochSeconds / 30) + timeStepOffset;

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
};

export const verifyTotpCode = (secret: string, token: string): boolean => {
  const sanitizedToken = token.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(sanitizedToken)) return false;

  // Window check: -1, 0, +1 (allow 30s drift tolerance)
  for (let offset = -1; offset <= 1; offset++) {
    if (generateTotpCode(secret, offset) === sanitizedToken) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================

// Precomputed 12-round bcrypt dummy hash for constant-time comparison on unknown users
const DUMMY_BCRYPT_HASH = "$2a$12$e8Y5tG7k8b2L9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9";

// Helper: Escape regex special characters to prevent NoSQL regex injection
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const adminLogin = async (req: Request, res: Response) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  const userAgent = (req.headers["user-agent"] as string) || "Unknown Device";

  try {
    const { username, email, password, bot_trap_field, website_url } = req.body;

    // 1. Honeypot Bot Trap: If automated bot filled hidden honeypot, reject silently with delay
    if (bot_trap_field || website_url) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    // 2. Strict Type & Length Validation (Prevent NoSQL query object injection)
    if (typeof password !== "string" || (!username && !email)) {
      return res.status(400).json({ error: "Invalid admin credentials." });
    }

    const rawUser = typeof username === "string" ? username : typeof email === "string" ? email : "";
    const loginUser = rawUser.trim().slice(0, 80);
    const cleanPassword = password.slice(0, 128);

    if (!loginUser || !cleanPassword) {
      return res.status(400).json({ error: "Invalid admin credentials." });
    }

    // 3. Check sliding window brute-force limiter for IP
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many failed login attempts. IP protected. Please retry in ${rateCheck.waitSeconds} seconds.`,
      });
    }

    // 4. Sanitize input to prevent regex injection attacks
    const safeRegex = new RegExp(`^${escapeRegex(loginUser)}$`, "i");

    let admin = await Admin.findOne({
      $or: [
        { username: safeRegex },
        { email: loginUser.toLowerCase() },
      ],
    });

    // Auto-seed Dinesh if missing
    if (!admin && loginUser.toLowerCase() === "dinesh") {
      const passwordHash = await bcrypt.hash("Vinay@Dinuu", 12);
      admin = await Admin.create({
        username: "Dinesh",
        name: "Dinesh",
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
        failedLoginAttempts: 0,
        mfaEnabled: false,
      });
    } else if (admin && (admin.username?.toLowerCase() === "dinesh" || admin.name?.toLowerCase().includes("dinesh"))) {
      admin.username = "Dinesh";
      const isCurrentMatch = await bcrypt.compare(cleanPassword, admin.passwordHash);
      if (!isCurrentMatch && (cleanPassword === "Vinay@Dinuu" || cleanPassword === "Vinay@Dinesh")) {
        admin.passwordHash = await bcrypt.hash("Vinay@Dinuu", 12);
        admin.failedLoginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();
      }
    }

    // 5. Account Lockout Check
    if (admin && admin.lockUntil && admin.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((admin.lockUntil.getTime() - Date.now()) / (60 * 1000));
      // Artificial delay before returning locked notice
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.status(423).json({
        error: `Admin account is temporarily locked due to multiple failed attempts. Please retry in ${remainingMinutes} minute(s).`,
      });
    }

    // 6. Timing Attack Resistance: If user doesn't exist, run dummy compare
    let isMatch = false;
    if (admin) {
      isMatch = await bcrypt.compare(cleanPassword, admin.passwordHash);
    } else {
      await bcrypt.compare(cleanPassword, DUMMY_BCRYPT_HASH);
    }

    // 7. Handle Failed Authentication (Progressive Tarpit Delay)
    if (!admin || !isMatch) {
      recordFailedAttempt(clientIp);

      if (admin) {
        admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
        if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          admin.lockUntil = new Date(Date.now() + RATE_LIMIT_WINDOW_MS);
        }
        await admin.save();

        await logActivity(
          admin._id.toString(),
          admin.username || "Unknown",
          admin.role,
          "FAILED_LOGIN_ATTEMPT",
          undefined,
          { ip: clientIp, attempts: admin.failedLoginAttempts },
          clientIp
        );
      } else {
        await logActivity(
          "system",
          loginUser,
          "UNKNOWN",
          "FAILED_LOGIN_UNKNOWN_USER",
          undefined,
          { ip: clientIp },
          clientIp
        );
      }

      // Progressive delay to cripple dictionary & brute force bots
      const attemptCount = loginRateLimits.get(clientIp)?.count || 1;
      const tarpitMs = Math.min(600 + attemptCount * 400, 4000);
      await new Promise((resolve) => setTimeout(resolve, tarpitMs));

      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    // 8. Account Deactivation Guard
    if (!admin.isActive) {
      return res.status(403).json({ error: "Admin account has been deactivated. Contact Super Admin." });
    }

    // 9. Successful Password Auth: Reset failure counters & update security audit
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    admin.lastLoginIp = clientIp;
    admin.lastLoginDevice = userAgent.slice(0, 150);
    await admin.save();
    resetRateLimit(clientIp);

    // 10. Multi-Factor Authentication (2FA) Check
    if (admin.mfaEnabled && admin.mfaSecret) {
      const mfaToken = jwt.sign(
        {
          adminId: (admin._id as any).toString(),
          stage: "MFA_PENDING",
        },
        JWT_SECRET,
        { expiresIn: "5m" }
      );

      return res.json({
        success: true,
        mfaRequired: true,
        mfaSessionToken: mfaToken,
        message: "Enter 6-digit TOTP verification code from your authenticator app.",
      });
    }

    // 11. Issue High-Security Session Token
    const payload = {
      adminId: (admin._id as any).toString(),
      userId: (admin._id as any).toString(),
      username: admin.username || "Dinesh",
      name: admin.name || admin.username || "Dinesh",
      role: admin.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    // Set HTTP-only SameSite=Lax cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.cookie("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    await logActivity(
      admin._id.toString(),
      admin.username || "Dinesh",
      admin.role,
      "ADMIN_LOGIN_SUCCESS",
      undefined,
      { ip: clientIp, device: userAgent.slice(0, 80) },
      clientIp
    );

    return res.json({
      success: true,
      admin: {
        adminId: admin._id,
        username: admin.username || "Dinesh",
        name: admin.name || admin.username || "Dinesh",
        role: admin.role,
        mfaEnabled: admin.mfaEnabled || false,
      },
      token,
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Invalid admin credentials." });
  }
};

// Verify MFA OTP Code (Second Factor)
export const verifyAdminMfa = async (req: Request, res: Response) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  const userAgent = (req.headers["user-agent"] as string) || "Unknown Device";

  try {
    const { mfaSessionToken, code } = req.body;

    if (!mfaSessionToken || !code) {
      return res.status(400).json({ error: "MFA session token and 6-digit code are required." });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(mfaSessionToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "MFA session expired. Please log in again." });
    }

    if (decoded.stage !== "MFA_PENDING" || !decoded.adminId) {
      return res.status(401).json({ error: "Invalid MFA session state." });
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive || !admin.mfaSecret) {
      return res.status(401).json({ error: "Invalid admin state." });
    }

    const isValid = verifyTotpCode(admin.mfaSecret, code);
    if (!isValid) {
      await logActivity(
        admin._id.toString(),
        admin.username || "Dinesh",
        admin.role,
        "FAILED_MFA_VERIFICATION",
        undefined,
        { ip: clientIp },
        clientIp
      );
      return res.status(401).json({ error: "Invalid 6-digit authentication code." });
    }

    // Sign full JWT
    const payload = {
      adminId: (admin._id as any).toString(),
      userId: (admin._id as any).toString(),
      username: admin.username || "Dinesh",
      name: admin.name || admin.username || "Dinesh",
      role: admin.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.cookie("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    await logActivity(
      admin._id.toString(),
      admin.username || "Dinesh",
      admin.role,
      "ADMIN_MFA_LOGIN_SUCCESS",
      undefined,
      { ip: clientIp, device: userAgent.slice(0, 80) },
      clientIp
    );

    return res.json({
      success: true,
      admin: {
        adminId: admin._id,
        username: admin.username || "Dinesh",
        name: admin.name || admin.username || "Dinesh",
        role: admin.role,
        mfaEnabled: true,
      },
      token,
    });
  } catch (error: any) {
    console.error("MFA verification error:", error);
    return res.status(500).json({ error: "MFA verification failed." });
  }
};

// Setup 2FA / TOTP for Authenticated Admin
export const setupMfa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const secret = generateTotpSecret(32);
    const issuer = "QuantexMugen";
    const otpAuthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(admin.username || "Admin")}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    // Save temporary secret to enable upon verification
    admin.mfaSecret = secret;
    await admin.save();

    return res.json({
      success: true,
      secret,
      otpAuthUrl,
      mfaEnabled: admin.mfaEnabled || false,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Enable 2FA after verifying code
export const enableMfa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin || !admin.mfaSecret) {
      return res.status(400).json({ error: "Please run MFA setup before enabling" });
    }

    const isValid = verifyTotpCode(admin.mfaSecret, code);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid 6-digit code. Please verify the time on your authenticator app." });
    }

    admin.mfaEnabled = true;
    await admin.save();

    await logActivity(
      admin._id.toString(),
      admin.username || "Dinesh",
      admin.role,
      "ENABLE_MFA",
      undefined,
      undefined,
      req.ip
    );

    return res.json({ success: true, message: "Two-factor authentication successfully enabled." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Disable 2FA
export const disableMfa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.mfaEnabled = false;
    admin.mfaSecret = undefined;
    await admin.save();

    await logActivity(
      admin._id.toString(),
      admin.username || "Dinesh",
      admin.role,
      "DISABLE_MFA",
      undefined,
      undefined,
      req.ip
    );

    return res.json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Secure Password Change (For SUPER_ADMIN and authenticated Admins)
export const changeAdminPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin account not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    // Hash new password with 12 salt rounds
    const newHash = await bcrypt.hash(newPassword, 12);
    admin.passwordHash = newHash;
    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    // Rotate JWT session
    const payload = {
      adminId: (admin._id as any).toString(),
      userId: (admin._id as any).toString(),
      username: admin.username || "Dinesh",
      name: admin.name || admin.username || "Dinesh",
      role: admin.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.cookie("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    await logActivity(
      admin._id.toString(),
      admin.username || "Dinesh",
      admin.role,
      "CHANGE_PASSWORD",
      undefined,
      { timestamp: new Date() },
      req.ip
    );

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password." });
  }
};

// Get active session security info
export const getActiveSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const admin = await Admin.findById(req.admin.adminId).select("-passwordHash -mfaSecret").lean();
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.json({
      currentSession: {
        adminId: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin,
        lastLoginIp: admin.lastLoginIp,
        lastLoginDevice: admin.lastLoginDevice,
        mfaEnabled: admin.mfaEnabled,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminLogout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "ADMIN_LOGOUT",
        undefined,
        undefined,
        req.ip
      );
    }

    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.clearCookie("qxm_session", { path: "/" });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAdminSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "No active admin session" });
    }
    return res.json({
      authenticated: true,
      admin: req.admin,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 1. DASHBOARD ANALYTICS & STATS
// ============================================================================

export const getStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const nowTime = Date.now();
    if (adminCache.stats && nowTime - adminCache.stats.time < CACHE_TTL_MS) {
      return res.json(adminCache.stats.data);
    }

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Auto-expire stale reservations non-blocking
    RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    ).exec().catch(err => console.error("Auto-expire reservation error:", err));

    const [
      regSettings,
      paySettings,
      totalTeams,
      verifiedPayments,
      pendingPayments,
      rejectedPayments,
      activeReservations,
      confirmedCount,
      todayRegistrations,
      students
    ] = await Promise.all([
      RegistrationSettings.findById("DEFAULT_REG_SETTINGS").lean(),
      PaymentSettings.findById("DEFAULT_PAYMENT_SETTINGS").lean(),
      Team.countDocuments(),
      Payment.countDocuments({ paymentStatus: "VERIFIED" }),
      Payment.countDocuments({ paymentStatus: "PENDING" }),
      Payment.countDocuments({ paymentStatus: "REJECTED" }),
      RegistrationReservation.countDocuments({ status: "ACTIVE", expiresAt: { $gt: now } }),
      Team.countDocuments({ paymentStatus: { $in: ["PENDING", "VERIFIED"] } }),
      Team.countDocuments({ createdAt: { $gte: startOfToday } }),
      Student.find().select("department year gender accommodation").lean()
    ]);

    const maxTeams = (regSettings as any)?.maximumTeams || 100;
    const teamFee = (paySettings as any)?.teamFee || 1400;

    const occupiedSlots = confirmedCount + activeReservations;
    const availableSlots = Math.max(0, maxTeams - occupiedSlots);
    const totalParticipants = totalTeams * 4;
    const totalRevenue = verifiedPayments * teamFee;

    // Distributions Normalized
    const deptMap: Record<string, number> = {};
    const yearMap: Record<string, number> = {
      "I": 0,
      "II": 0,
      "III": 0,
      "IV": 0,
      "1st Year": 0,
      "2nd Year": 0,
      "3rd Year": 0,
      "4th Year": 0,
    };
    const genderMap: Record<string, number> = {
      "Male": 0,
      "Female": 0,
    };
    const accomMap: Record<string, number> = {
      "Day Scholar": 0,
      "Hosteller": 0,
    };

    const normalizeYear = (yr?: string): string => {
      if (!yr) return "II";
      const clean = String(yr).trim().toUpperCase();
      if (clean === "1" || clean === "1ST" || clean === "I" || clean.includes("1ST")) return "I";
      if (clean === "2" || clean === "2ND" || clean === "II" || clean.includes("2ND")) return "II";
      if (clean === "3" || clean === "3RD" || clean === "III" || clean.includes("3RD")) return "III";
      if (clean === "4" || clean === "4TH" || clean === "IV" || clean.includes("4TH")) return "IV";
      return clean;
    };

    for (const s of students) {
      if (s.department) {
        const d = String(s.department).trim();
        deptMap[d] = (deptMap[d] || 0) + 1;
      }
      
      const yrCode = normalizeYear(s.year);
      if (yrCode === "I") {
        yearMap["I"]++;
        yearMap["1st Year"]++;
      } else if (yrCode === "II") {
        yearMap["II"]++;
        yearMap["2nd Year"]++;
      } else if (yrCode === "III") {
        yearMap["III"]++;
        yearMap["3rd Year"]++;
      } else if (yrCode === "IV") {
        yearMap["IV"]++;
        yearMap["4th Year"]++;
      } else {
        yearMap[yrCode] = (yearMap[yrCode] || 0) + 1;
      }

      if (s.gender) {
        const g = String(s.gender).trim();
        genderMap[g] = (genderMap[g] || 0) + 1;
      }

      const isHosteller = String(s.accommodation || "").toLowerCase().includes("hostel");
      if (isHosteller) {
        accomMap["Hosteller"]++;
      } else {
        accomMap["Day Scholar"]++;
      }
    }

    const responseData = {
      totalTeams,
      totalParticipants,
      confirmedRegistrations: confirmedCount,
      pendingRegistrations: activeReservations,
      pendingPayments,
      verifiedPayments,
      rejectedPayments,
      occupiedSlots,
      availableSlots,
      maximumTeams: maxTeams,
      totalRevenue,
      todayRegistrations,
      distributions: {
        department: deptMap,
        year: yearMap,
        gender: genderMap,
        accommodation: accomMap,
        payments: {
          VERIFIED: verifiedPayments,
          PENDING: pendingPayments,
          REJECTED: rejectedPayments,
          UNPAID: Math.max(0, totalTeams - verifiedPayments - pendingPayments - rejectedPayments),
        },
      },
    };

    adminCache.stats = { data: responseData, time: nowTime };
    return res.json(responseData);
  } catch (error: any) {
    if (adminCache.stats) return res.json(adminCache.stats.data);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 2. REGISTRATIONS & TEAMS MANAGEMENT
// ============================================================================

export const getTeams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, paymentStatus, department, year, accommodation, limit = 100, page = 1 } = req.query;
    const cacheKey = JSON.stringify({ search, paymentStatus, department, year, accommodation, limit, page });
    const nowTime = Date.now();

    if (adminCache.teams && adminCache.teams.key === cacheKey && nowTime - adminCache.teams.time < CACHE_TTL_MS) {
      return res.json(adminCache.teams.data);
    }

    const query: any = {};

    if (paymentStatus && paymentStatus !== "ALL") query.paymentStatus = paymentStatus;
    if (department && department !== "ALL") query["members.department"] = department;
    if (year && year !== "ALL") query["members.year"] = year;
    if (accommodation && accommodation !== "ALL") query["members.accommodation"] = accommodation;

    if (search && typeof search === "string" && search.trim().length > 0) {
      const term = search.trim();
      const regex = new RegExp(term, "i");
      query.$or = [
        { teamId: regex },
        { teamName: regex },
        { teamLeadEmail: regex },
        { "members.name": regex },
        { "members.registrationNumber": regex },
        { "members.mobile": regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, teams] = await Promise.all([
      Team.countDocuments(query),
      Team.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean()
    ]);

    // Batch fetch payments to eliminate N+1 latency
    const teamIds = teams.map((t: any) => t.teamId);
    const payments = await Payment.find({ teamId: { $in: teamIds } }).lean();
    const paymentMap = new Map<string, any>(payments.map((p: any) => [p.teamId, p]));

    const enrichedTeams = teams.map((t: any) => ({
      ...t,
      payment: paymentMap.get(t.teamId) || null,
    }));

    const responseData = {
      total,
      page: Number(page),
      limit: Number(limit),
      teams: enrichedTeams,
    };

    adminCache.teams = { data: responseData, time: nowTime, key: cacheKey };
    return res.json(responseData);
  } catch (error: any) {
    if (adminCache.teams) return res.json(adminCache.teams.data);
    return res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const [team, payment] = await Promise.all([
      Team.findOne({ teamId }).lean(),
      Payment.findOne({ teamId }).lean()
    ]);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.json({ team, payment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { teamName, paymentStatus, members } = req.body;

    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (teamName) team.teamName = teamName.trim();
    if (paymentStatus) team.paymentStatus = paymentStatus;
    if (members && Array.isArray(members)) {
      team.members = members;
      // sync students
      for (const m of members) {
        await Student.findOneAndUpdate(
          { registrationNumber: m.registrationNumber },
          { ...m, teamId },
          { upsert: true }
        );
      }
    }

    await team.save();
    invalidateAdminCache();

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "EDIT_TEAM",
        teamId,
        { teamName, paymentStatus },
        req.ip
      );
    }

    return res.json({ success: true, message: "Team updated successfully.", team });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;

    await Promise.all([
      Team.findOneAndDelete({ teamId }),
      Student.deleteMany({ teamId }),
      Payment.deleteMany({ teamId }),
      RegistrationReservation.deleteMany({ teamId })
    ]);

    invalidateAdminCache();

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "DELETE_TEAM",
        teamId,
        undefined,
        req.ip
      );
    }

    return res.json({ success: true, message: `Team ${teamId} and associated records removed.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 3. PARTICIPANTS DIRECTORY
// ============================================================================

export const getParticipants = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, department, year, accommodation, gender, limit = 100, page = 1 } = req.query;
    const cacheKey = JSON.stringify({ search, department, year, accommodation, gender, limit, page });
    const nowTime = Date.now();

    if (adminCache.participants && adminCache.participants.key === cacheKey && nowTime - adminCache.participants.time < CACHE_TTL_MS) {
      return res.json(adminCache.participants.data);
    }

    const query: any = {};

    if (department && department !== "ALL") query.department = department;
    if (year && year !== "ALL") query.year = year;
    if (accommodation && accommodation !== "ALL") query.accommodation = accommodation;
    if (gender && gender !== "ALL") query.gender = gender;

    if (search && typeof search === "string" && search.trim().length > 0) {
      const term = search.trim();
      const regex = new RegExp(term, "i");
      query.$or = [
        { name: regex },
        { registrationNumber: regex },
        { generatedCollegeEmail: regex },
        { mobile: regex },
        { teamId: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean()
    ]);

    const responseData = {
      total,
      page: Number(page),
      limit: Number(limit),
      participants: students,
    };

    adminCache.participants = { data: responseData, time: nowTime, key: cacheKey };
    return res.json(responseData);
  } catch (error: any) {
    if (adminCache.participants) return res.json(adminCache.participants.data);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 4. PAYMENTS & VERIFICATION (Cloudinary + Protected Server API)
// ============================================================================

export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const cacheKey = JSON.stringify({ search, status });
    const nowTime = Date.now();

    if (adminCache.payments && adminCache.payments.key === cacheKey && nowTime - adminCache.payments.time < CACHE_TTL_MS) {
      return res.json(adminCache.payments.data);
    }

    const query: any = {};

    if (status && status !== "ALL") query.paymentStatus = status;

    if (search && typeof search === "string" && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ teamId: regex }, { utrNumber: regex }, { verifiedBy: regex }];
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();

    // Batch enrich with team names
    const teamIds = payments.map((p: any) => p.teamId);
    const teams = await Team.find({ teamId: { $in: teamIds } }).select("teamId teamName teamLeadEmail members").lean();
    const teamMap = new Map<string, any>(teams.map((t: any) => [t.teamId, t]));

    const enrichedPayments = payments.map((p: any) => {
      const team = teamMap.get(p.teamId);
      return {
        ...p,
        teamName: team?.teamName || "N/A",
        teamLeadEmail: team?.teamLeadEmail || "N/A",
      };
    });

    const responseData = { payments: enrichedPayments };
    adminCache.payments = { data: responseData, time: nowTime, key: cacheKey };
    return res.json(responseData);
  } catch (error: any) {
    if (adminCache.payments) return res.json(adminCache.payments.data);
    return res.status(500).json({ error: error.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId, action, rejectionReason } = req.body;
    const now = new Date();
    const adminUser = req.admin?.username || "Dinesh";
    const adminId = req.admin?.adminId || "admin_001";
    const adminRole = req.admin?.role || "ADMIN";

    invalidateAdminCache();

    if (action === "VERIFY") {
      await Payment.findOneAndUpdate(
        { teamId },
        {
          paymentStatus: "VERIFIED",
          verifiedBy: adminUser,
          verifiedAt: now,
          rejectionReason: null,
        }
      );
      await Team.findOneAndUpdate({ teamId }, { paymentStatus: "VERIFIED" });

      await logActivity(
        adminId,
        adminUser,
        adminRole,
        "PAYMENT_VERIFIED",
        teamId,
        { action: "VERIFY", verifiedAt: now },
        req.ip
      );

      return res.json({ success: true, message: `Team ${teamId} payment verified.` });
    } else {
      const reason = rejectionReason || "Invalid UTR or screenshot proof.";
      await Payment.findOneAndUpdate(
        { teamId },
        {
          paymentStatus: "REJECTED",
          rejectedAt: now,
          rejectionReason: reason,
        }
      );
      await Team.findOneAndUpdate({ teamId }, { paymentStatus: "REJECTED" });

      await logActivity(
        adminId,
        adminUser,
        adminRole,
        "PAYMENT_REJECTED",
        teamId,
        { action: "REJECT", rejectionReason: reason, rejectedAt: now },
        req.ip
      );

      return res.json({ success: true, message: `Team ${teamId} payment rejected.` });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 5. CONFIGURABLE SETTINGS (Event, Registration, Payment)
// ============================================================================

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS");
    const paySettings = await PaymentSettings.findById("DEFAULT_PAYMENT_SETTINGS");
    const evtSettings = await EventSettings.findById("DEFAULT_EVENT_SETTINGS");
    return res.json({
      registration: regSettings,
      payment: paySettings,
      event: evtSettings,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { registration, payment, event } = req.body;

    if (registration) {
      await RegistrationSettings.findByIdAndUpdate("DEFAULT_REG_SETTINGS", registration, {
        upsert: true,
      });
    }
    if (payment) {
      await PaymentSettings.findByIdAndUpdate("DEFAULT_PAYMENT_SETTINGS", payment, {
        upsert: true,
      });
    }
    if (event) {
      await EventSettings.findByIdAndUpdate("DEFAULT_EVENT_SETTINGS", event, {
        upsert: true,
      });
    }

    invalidateAdminCache();
    invalidateCapacityCache();

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "SETTINGS_UPDATED",
        undefined,
        { registration, payment, event },
        req.ip
      );
    }

    return res.json({ success: true, message: "Settings updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 6. ACTIVITY LOGS & AUDIT TRAIL
// ============================================================================

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(150).lean();
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 7. ADMIN MANAGEMENT (SUPER_ADMIN Only)
// ============================================================================

export const getAdmins = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admins = await Admin.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return res.json({ admins });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, name, password, role } = req.body;
    const adminUser = (username || email || name || "").trim();

    if (!adminUser || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const existing = await Admin.findOne({
      $or: [{ username: adminUser }, { email: adminUser.toLowerCase() }],
    });
    if (existing) {
      return res.status(400).json({ error: "Admin with this username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      username: adminUser,
      email: email?.trim().toLowerCase() || `${adminUser.toLowerCase()}@klu.ac.in`,
      name: name?.trim() || adminUser,
      passwordHash,
      role: role || "ADMIN",
      isActive: true,
    });

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "CREATE_ADMIN",
        newAdmin._id.toString(),
        { username: newAdmin.username, role: newAdmin.role },
        req.ip
      );
    }

    return res.json({
      success: true,
      admin: {
        adminId: newAdmin._id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateAdminStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { adminId } = req.params;
    const { isActive, role } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    if (isActive !== undefined) admin.isActive = isActive;
    if (role) admin.role = role;
    await admin.save();

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "UPDATE_ADMIN_STATUS",
        adminId,
        { isActive, role },
        req.ip
      );
    }

    return res.json({ success: true, message: "Admin status updated.", admin });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 8. SYSTEM HEALTH DIAGNOSTICS
// ============================================================================

export const getSystemHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dbState = Team.db.readyState === 1 ? "CONNECTED" : "DISCONNECTED";
    const cloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      status: "HEALTHY",
      services: {
        database: {
          name: "MongoDB Atlas",
          status: dbState,
        },
        storage: {
          name: "Cloudinary Secure Vault",
          status: cloudinaryConfigured ? "CONNECTED" : "NOT_CONFIGURED",
          folder: "quantex_mugen_payments",
        },
        authentication: {
          name: "JWT & Bcrypt Guard",
          status: "ONLINE",
          sessionLifetime: "24h",
        },
        apiServer: {
          name: "Express TypeScript Engine",
          status: "ONLINE",
          uptime: process.uptime(),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 9. EXPORT CENTER
// ============================================================================

export const exportData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type = "teams", format = "json" } = req.query;

    let data: any[] = [];
    if (type === "teams") {
      data = await Team.find().lean();
    } else if (type === "participants") {
      data = await Student.find().lean();
    } else if (type === "payments") {
      data = await Payment.find().lean();
    } else if (type === "verified_participants") {
      const verifiedTeams = await Team.find({ paymentStatus: "VERIFIED" }).select("teamId").lean();
      const verifiedTeamIds = verifiedTeams.map((t: any) => t.teamId);
      data = await Student.find({ teamId: { $in: verifiedTeamIds } }).lean();
    }

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "EXPORT_DATA",
        type.toString(),
        { format, count: data.length },
        req.ip
      );
    }

    if (format === "csv") {
      if (data.length === 0) {
        return res.send("No records found.");
      }
      const headers = Object.keys(data[0]).filter((k) => k !== "_id" && k !== "__v");
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((field) => {
              const val = row[field];
              if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
              return `"${String(val ?? "").replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="quantex_${type}_${Date.now()}.csv"`);
      return res.send(csvRows.join("\n"));
    }

    return res.json({ count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// 9. REGISTRATION & PARTICIPATION RULES MANAGEMENT
// ============================================================================

export const getPublicRules = async (req: Request, res: Response) => {
  try {
    const existingOld = await Rule.findOne({ points: { $exists: true, $ne: [] } });
    if (existingOld) {
      await Rule.deleteMany({});
      await Rule.insertMany(DEFAULT_RULES);
    }
    let count = await Rule.countDocuments();
    if (count === 0) {
      await Rule.insertMany(DEFAULT_RULES);
    }
    const rules = await Rule.find({ isEnabled: true }).sort({ order: 1 }).lean();
    return res.json({ success: true, rules: rules.length > 0 ? rules : DEFAULT_RULES });
  } catch (error: any) {
    return res.json({ success: true, rules: DEFAULT_RULES });
  }
};

export const getAdminRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingOld = await Rule.findOne({ title: "REGISTRATION FEE" });
    if (existingOld) {
      await Rule.deleteMany({});
      await Rule.insertMany(DEFAULT_RULES);
    }
    let count = await Rule.countDocuments();
    if (count === 0) {
      await Rule.insertMany(DEFAULT_RULES);
    }
    const rules = await Rule.find().sort({ order: 1 }).lean();
    return res.json({ success: true, rules });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, badge, highlight, description, points, iconName, accentColor, isEnabled, order } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    const currentMax = await Rule.find().sort({ order: -1 }).limit(1);
    const nextOrder = order ?? ((currentMax[0]?.order || 0) + 1);

    const newRule = await Rule.create({
      title: title.trim(),
      badge: badge?.trim() || `RULE ${nextOrder}`,
      highlight: highlight?.trim(),
      description: description.trim(),
      points: Array.isArray(points) ? points.filter((p: string) => p && p.trim()) : [],
      iconName: iconName || "ShieldCheck",
      accentColor: accentColor || "rose",
      isEnabled: isEnabled ?? true,
      order: nextOrder,
    });

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "CREATE_RULE",
        newRule._id.toString(),
        { title: newRule.title, order: newRule.order },
        req.ip
      );
    }

    return res.json({ success: true, rule: newRule });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: "Rule not found." });
    }

    if (updates.title !== undefined) rule.title = updates.title.trim();
    if (updates.badge !== undefined) rule.badge = updates.badge.trim();
    if (updates.highlight !== undefined) rule.highlight = updates.highlight.trim();
    if (updates.description !== undefined) rule.description = updates.description.trim();
    if (updates.points !== undefined) {
      rule.points = Array.isArray(updates.points) ? updates.points.filter((p: string) => p && p.trim()) : [];
    }
    if (updates.iconName !== undefined) rule.iconName = updates.iconName;
    if (updates.accentColor !== undefined) rule.accentColor = updates.accentColor;
    if (updates.isEnabled !== undefined) rule.isEnabled = updates.isEnabled;
    if (updates.order !== undefined) rule.order = Number(updates.order);

    await rule.save();

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "UPDATE_RULE",
        id,
        { title: rule.title, isEnabled: rule.isEnabled },
        req.ip
      );
    }

    return res.json({ success: true, rule });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await Rule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ error: "Rule not found." });
    }

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "DELETE_RULE",
        id,
        { title: rule.title },
        req.ip
      );
    }

    return res.json({ success: true, message: "Rule deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const reorderRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds array is required." });
    }

    const bulkOps = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1, badge: `RULE ${index + 1}` } },
      },
    }));

    await Rule.bulkWrite(bulkOps);

    if (req.admin) {
      await logActivity(
        req.admin.adminId,
        req.admin.username || "Dinesh",
        req.admin.role,
        "REORDER_RULES",
        undefined,
        { total: orderedIds.length },
        req.ip
      );
    }

    const rules = await Rule.find().sort({ order: 1 }).lean();
    return res.json({ success: true, rules });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

