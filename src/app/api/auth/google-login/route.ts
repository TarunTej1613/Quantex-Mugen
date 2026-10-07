import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { isValidKluEmail, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name, googleId } = await req.json();

    if (!email || !isValidKluEmail(email)) {
      return NextResponse.json(
        { error: "Access restricted. Only @klu.ac.in official Google accounts are permitted." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Auto-create student user with Google ID
      user = await User.create({
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        role: normalizedEmail.includes("admin") ? "ADMIN" : "STUDENT",
        googleId: googleId || `google_${Date.now()}`,
      });
    } else {
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = signToken({
      userId: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
      },
    });

    response.cookies.set("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Google Auth API error:", error);
    return NextResponse.json(
      { error: error.message || "Google Authentication failed" },
      { status: 500 }
    );
  }
}
