import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database seeded with default settings, Admin account, and sample team QXM-001.",
      adminCredentials: {
        email: "admin@klu.ac.in",
        password: "Admin@KLU2026",
      },
      teamLeadCredentials: {
        email: "2100030001@klu.ac.in",
        password: "Lead@KLU2026",
        teamId: "QXM-001",
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
