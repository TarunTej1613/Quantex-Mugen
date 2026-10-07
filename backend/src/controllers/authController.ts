import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "quantex_mugen_super_cyber_jwt_secret_key_2026";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !email.trim().toLowerCase().endsWith("@klu.ac.in")) {
      return res.status(400).json({
        error: "Access restricted. Only @klu.ac.in official Google accounts are permitted.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0].toUpperCase(),
        role: normalizedEmail.includes("admin") ? "ADMIN" : "STUDENT",
        googleId: googleId || `google_${Date.now()}`,
      });
    } else {
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (error: any) {
    console.error("Google login error:", error);
    return res.status(500).json({ error: error.message || "Authentication failed" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies?.qxm_session ||
      req.cookies?.qxm_admin_session ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.json({ user: null, authenticated: false });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      let user = await User.findById(decoded.userId).select("-password");
      if (!user && decoded.adminId) {
        return res.json({
          user: {
            id: decoded.adminId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          },
          authenticated: true,
        });
      }

      if (!user) {
        return res.json({ user: null, authenticated: false });
      }

      return res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
        },
        authenticated: true,
      });
    } catch {
      return res.json({ user: null, authenticated: false });
    }
  } catch (error: any) {
    return res.json({ user: null, authenticated: false });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("qxm_session");
  return res.json({ success: true, message: "Logged out successfully" });
};
