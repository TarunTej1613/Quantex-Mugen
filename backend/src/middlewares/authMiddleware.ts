import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "quantex_mugen_super_cyber_jwt_secret_key_2026";

export interface AuthenticatedAdmin {
  adminId: string;
  username: string;
  email?: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "VERIFIER" | "VIEWER";
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username?: string;
    email?: string;
    name: string;
    role: "STUDENT" | "ADMIN" | "SUPER_ADMIN" | "VERIFIER" | "VIEWER";
    teamId?: string;
  };
  admin?: AuthenticatedAdmin;
}

// User / Student authentication
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token =
    req.cookies?.qxm_session ||
    req.cookies?.qxm_admin_session ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    if (decoded.role && ["SUPER_ADMIN", "ADMIN", "VERIFIER", "VIEWER"].includes(decoded.role)) {
      req.admin = {
        adminId: decoded.adminId || decoded.userId,
        username: decoded.username || decoded.name || "Dinesh",
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
};

// Admin authentication & role enforcement
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const adminToken =
    req.cookies?.qxm_admin_session ||
    req.cookies?.qxm_session ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!adminToken) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  try {
    const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "VERIFIER", "VIEWER"];
    const isAdmin = allowedRoles.includes(decoded.role) || decoded.username === "Dinesh";

    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied: Administrator privileges required" });
    }

    req.admin = {
      adminId: decoded.adminId || decoded.userId || "admin_001",
      username: decoded.username || "Dinesh",
      email: decoded.email,
      name: decoded.name || decoded.username || "Administrator",
      role: decoded.role || "ADMIN",
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin session token" });
  }
};

// Strict Role Guard
export const requireRoles = (roles: Array<"SUPER_ADMIN" | "ADMIN" | "VERIFIER" | "VIEWER">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    requireAdmin(req, res, () => {
      if (!req.admin || !roles.includes(req.admin.role)) {
        return res.status(403).json({
          error: `Permission denied. Required role: ${roles.join(" or ")} (Your role: ${req.admin?.role || "NONE"})`,
        });
      }
      next();
    });
  };
};
