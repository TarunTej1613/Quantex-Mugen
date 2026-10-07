import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { comparePassword, hashPassword, isValidKluEmail, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !isValidKluEmail(email)) {
      return NextResponse.json(
        { error: "Access restricted. Only @klu.ac.in official emails are permitted." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Auto-register team lead if account doesn't exist yet
      const hashedPassword = await hashPassword(password);
      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        name: name || normalizedEmail.split("@")[0],
        role: normalizedEmail.includes("admin") ? "ADMIN" : "STUDENT",
      });
    } else {
      // Verify existing password
      if (user.password) {
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid credentials. Please verify your password." },
            { status: 401 }
          );
        }
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
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
