import { Router } from "express";
import {
  adminLogin,
  verifyAdminMfa,
  setupMfa,
  enableMfa,
  disableMfa,
  changeAdminPassword,
  getActiveSessions,
  adminLogout,
  getAdminSession,
  getStats,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getParticipants,
  getPayments,
  verifyPayment,
  getSettings,
  updateSettings,
  getActivityLogs,
  getAdmins,
  createAdmin,
  updateAdminStatus,
  getSystemHealth,
  exportData,
  getAdminRules,
  createRule,
  updateRule,
  deleteRule,
  reorderRules,
} from "../controllers/adminController";
import { requireAdmin, requireRoles } from "../middlewares/authMiddleware";

const router = Router();

// --- Authentication, Session & Multi-Factor Auth (2FA) ---
router.post("/login", adminLogin);
router.post("/verify-mfa", verifyAdminMfa);
router.post("/mfa/setup", requireAdmin, setupMfa);
router.post("/mfa/enable", requireAdmin, enableMfa);
router.post("/mfa/disable", requireRoles(["SUPER_ADMIN"]), disableMfa);
router.post("/change-password", requireAdmin, changeAdminPassword);
router.get("/sessions", requireAdmin, getActiveSessions);
router.post("/logout", requireAdmin, adminLogout);
router.get("/session", requireAdmin, getAdminSession);
router.get("/me", requireAdmin, getAdminSession);

// --- Analytics & Statistics ---
router.get("/stats", requireAdmin, getStats);
router.get("/dashboard", requireAdmin, getStats);

// --- Teams & Registrations ---
router.get("/teams", requireAdmin, getTeams);
router.get("/registrations", requireAdmin, getTeams);
router.get("/teams/:teamId", requireAdmin, getTeamById);
router.put("/teams/:teamId", requireRoles(["SUPER_ADMIN", "ADMIN"]), updateTeam);
router.delete("/teams/:teamId", requireRoles(["SUPER_ADMIN"]), deleteTeam);

// --- Participants ---
router.get("/participants", requireAdmin, getParticipants);

// --- Payments & Verification ---
router.get("/payments", requireAdmin, getPayments);
router.post("/verify-payment", requireRoles(["SUPER_ADMIN", "ADMIN", "VERIFIER"]), verifyPayment);
router.patch("/payments/:id/verify", requireRoles(["SUPER_ADMIN", "ADMIN", "VERIFIER"]), verifyPayment);
router.patch("/payments/:id/reject", requireRoles(["SUPER_ADMIN", "ADMIN", "VERIFIER"]), verifyPayment);

// --- Configurable Settings ---
router.get("/settings", requireAdmin, getSettings);
router.post("/settings", requireRoles(["SUPER_ADMIN", "ADMIN"]), updateSettings);
router.patch("/settings", requireRoles(["SUPER_ADMIN", "ADMIN"]), updateSettings);

// --- Registration & Participation Rules ---
router.get("/rules", requireAdmin, getAdminRules);
router.post("/rules", requireRoles(["SUPER_ADMIN", "ADMIN"]), createRule);
router.patch("/rules/reorder", requireRoles(["SUPER_ADMIN", "ADMIN"]), reorderRules);
router.post("/rules/reorder", requireRoles(["SUPER_ADMIN", "ADMIN"]), reorderRules);
router.patch("/rules/:id", requireRoles(["SUPER_ADMIN", "ADMIN"]), updateRule);
router.put("/rules/:id", requireRoles(["SUPER_ADMIN", "ADMIN"]), updateRule);
router.delete("/rules/:id", requireRoles(["SUPER_ADMIN", "ADMIN"]), deleteRule);

// --- Activity Logs & Audit Trail ---
router.get("/activity-logs", requireRoles(["SUPER_ADMIN", "ADMIN"]), getActivityLogs);

// --- Admin Management (SUPER_ADMIN only) ---
router.get("/admins", requireRoles(["SUPER_ADMIN"]), getAdmins);
router.post("/admins", requireRoles(["SUPER_ADMIN"]), createAdmin);
router.patch("/admins/:adminId", requireRoles(["SUPER_ADMIN"]), updateAdminStatus);

// --- System Diagnostics & Data Export ---
router.get("/health", requireAdmin, getSystemHealth);
router.get("/export", requireAdmin, exportData);

export default router;
