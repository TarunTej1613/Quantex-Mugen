import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getSession, signToken } from "@/lib/auth";
import { Team } from "@/models/Team";
import { Student } from "@/models/Student";
import { RegistrationReservation } from "@/models/RegistrationReservation";
import { RegistrationSettings } from "@/models/Settings";
import { getNextTeamId } from "@/models/Counter";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { teamName, members } = await req.json();

    if (!teamName || typeof teamName !== "string" || teamName.trim().length < 3) {
      return NextResponse.json(
        { error: "Team name must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!members || !Array.isArray(members) || members.length !== 4) {
      return NextResponse.json(
        { error: "Every team must have exactly 4 participants." },
        { status: 400 }
      );
    }

    // Auto-authenticate or retrieve active session
    let session = await getSession();
    let currentUserId: string;
    let currentUserEmail: string;
    let currentUserName: string;

    if (!session) {
      const leaderRegNo = members[0]?.registrationNumber?.trim().toUpperCase();
      if (!leaderRegNo) {
        return NextResponse.json(
          { error: "Member 1 (Team Leader) register number is required." },
          { status: 400 }
        );
      }
      const leaderEmail = `${leaderRegNo.toLowerCase()}@klu.ac.in`;
      let user = await User.findOne({ email: leaderEmail });
      if (!user) {
        user = await User.create({
          email: leaderEmail,
          name: members[0].name ? members[0].name.trim() : leaderRegNo,
          role: leaderEmail.includes("admin") ? "ADMIN" : "STUDENT",
        });
      }
      currentUserId = (user._id as any).toString();
      currentUserEmail = user.email;
      currentUserName = user.name;
    } else {
      currentUserId = session.userId;
      currentUserEmail = session.email;
      currentUserName = session.name;
    }

    // Check capacity first
    const now = new Date();
    await RegistrationReservation.updateMany(
      { status: "ACTIVE", expiresAt: { $lt: now } },
      { status: "EXPIRED", releasedAt: now }
    );

    const regSettings = await RegistrationSettings.findById("DEFAULT_REG_SETTINGS");
    const maxTeams = regSettings?.maximumTeams || 100;
    const isRegOpen = regSettings ? regSettings.registrationOpen : true;

    if (!isRegOpen) {
      return NextResponse.json(
        { error: "Registration is currently closed by the organizers." },
        { status: 400 }
      );
    }

    // Check if current user already has a confirmed team
    const userExistingConfirmedTeam = await Team.findOne({
      teamLeadId: currentUserId,
      paymentStatus: { $in: ["PENDING", "VERIFIED"] },
    });

    if (userExistingConfirmedTeam) {
      return NextResponse.json(
        { error: `You already have a registered team (${userExistingConfirmedTeam.teamName} - ${userExistingConfirmedTeam.teamId}).` },
        { status: 400 }
      );
    }

    // Clean up any old UNPAID teams whose reservation has expired for this user
    const oldUnpaidTeams = await Team.find({
      teamLeadId: currentUserId,
      paymentStatus: "UNPAID",
    });

    for (const oldTeam of oldUnpaidTeams) {
      const oldRes = oldTeam.reservationId
        ? await RegistrationReservation.findOne({ reservationId: oldTeam.reservationId })
        : null;

      if (!oldRes || oldRes.status === "EXPIRED" || oldRes.status === "CANCELLED" || new Date(oldRes.expiresAt) <= now) {
        // Delete student entries for this old abandoned team
        await Student.deleteMany({ teamId: oldTeam.teamId });
        await Team.deleteOne({ _id: oldTeam._id });
        if (oldRes && oldRes.status === "ACTIVE") {
          oldRes.status = "EXPIRED";
          oldRes.releasedAt = now;
          await oldRes.save();
        }
      }
    }

    // Check capacity first
    const confirmedCount = await Team.countDocuments({
      paymentStatus: { $in: ["PENDING", "VERIFIED"] },
    });
    const activeResCount = await RegistrationReservation.countDocuments({
      status: "ACTIVE",
      expiresAt: { $gt: now },
      userId: { $ne: currentUserId },
    });

    if (confirmedCount + activeResCount >= maxTeams) {
      return NextResponse.json(
        { error: "Registrations are currently full for Quantex Mugen." },
        { status: 400 }
      );
    }

    // Check team name uniqueness (case-insensitive) against active/confirmed teams
    const normalizedTeamName = teamName.trim();
    const existingTeam = await Team.findOne({
      teamName: { $regex: new RegExp(`^${normalizedTeamName}$`, "i") },
    });

    if (existingTeam) {
      // If the existing team is UNPAID and its reservation expired, we can clean it up
      const existingRes = existingTeam.reservationId
        ? await RegistrationReservation.findOne({ reservationId: existingTeam.reservationId })
        : null;

      if (
        existingTeam.paymentStatus === "UNPAID" &&
        (!existingRes || existingRes.status === "EXPIRED" || new Date(existingRes.expiresAt) <= now)
      ) {
        await Student.deleteMany({ teamId: existingTeam.teamId });
        await Team.deleteOne({ _id: existingTeam._id });
      } else {
        return NextResponse.json(
          { error: `Team name "${normalizedTeamName}" is already taken. Please choose another name.` },
          { status: 400 }
        );
      }
    }

    // Validate members
    const regNumbersSet = new Set<string>();
    const formattedMembers = [];

    for (let i = 0; i < 4; i++) {
      const m = members[i];
      if (!m.name || !m.registrationNumber || !m.department || !m.year || !m.section || !m.mobile || !m.gender || !m.accommodation) {
        return NextResponse.json(
          { error: `Participant #${i + 1} has incomplete fields.` },
          { status: 400 }
        );
      }

      const regNo = m.registrationNumber.trim().toUpperCase();
      if (regNumbersSet.has(regNo)) {
        return NextResponse.json(
          { error: `Duplicate registration number "${regNo}" within your team.` },
          { status: 400 }
        );
      }
      regNumbersSet.add(regNo);

      // Check if registration number already registered in another confirmed/active team
      const existingStudent = await Student.findOne({ registrationNumber: regNo });
      if (existingStudent) {
        const studentTeam = await Team.findOne({ teamId: existingStudent.teamId });
        if (studentTeam) {
          if (studentTeam.paymentStatus === "PENDING" || studentTeam.paymentStatus === "VERIFIED") {
            return NextResponse.json(
              { error: `Student with Registration Number "${regNo}" is already registered in team "${studentTeam.teamName}".` },
              { status: 400 }
            );
          }
          if (studentTeam.paymentStatus === "UNPAID") {
            const studentRes = studentTeam.reservationId
              ? await RegistrationReservation.findOne({ reservationId: studentTeam.reservationId })
              : null;
            if (studentRes && studentRes.status === "ACTIVE" && new Date(studentRes.expiresAt) > now) {
              return NextResponse.json(
                { error: `Student with Registration Number "${regNo}" currently has an active reservation in team "${studentTeam.teamName}".` },
                { status: 400 }
              );
            } else {
              // Expired student team - clean up orphaned student record
              await Student.deleteOne({ _id: existingStudent._id });
            }
          }
        } else {
          // Orphaned student record
          await Student.deleteOne({ _id: existingStudent._id });
        }
      }

      // Check mobile
      if (!/^[0-9]{10}$/.test(m.mobile)) {
        return NextResponse.json(
          { error: `Participant #${i + 1} mobile number must be exactly 10 digits.` },
          { status: 400 }
        );
      }

      const generatedCollegeEmail = `${regNo.toLowerCase()}@klu.ac.in`;

      formattedMembers.push({
        name: m.name.trim(),
        registrationNumber: regNo,
        generatedCollegeEmail,
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

    // Create EXACT 5-MINUTE reservation slot (300 seconds)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const reservationId = `RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation = await RegistrationReservation.create({
      reservationId,
      userId: currentUserId,
      status: "ACTIVE",
      expiresAt,
    });

    // Generate atomic sequential Team ID (e.g. QXM-001)
    const teamId = await getNextTeamId();

    // Create team document
    const newTeam = await Team.create({
      teamId,
      teamName: normalizedTeamName,
      teamLeadId: currentUserId,
      teamLeadEmail: currentUserEmail,
      members: formattedMembers,
      paymentStatus: "UNPAID",
      reservationId,
    });

    // Update reservation with teamId
    reservation.teamId = teamId;
    await reservation.save();

    // Insert student records for duplicate lookup
    for (const member of formattedMembers) {
      await Student.create({
        ...member,
        teamId,
      });
    }

    // Update user's active teamId
    await User.findByIdAndUpdate(currentUserId, { teamId });

    // Generate/Refresh auth session cookie
    const token = signToken({
      userId: currentUserId,
      email: currentUserEmail,
      name: currentUserName,
      role: "STUDENT",
      teamId,
    });

    const response = NextResponse.json({
      success: true,
      teamId,
      teamName: normalizedTeamName,
      reservationId,
      expiresAt: expiresAt.toISOString(),
      serverTime: now.toISOString(),
      durationSeconds: 300,
    });

    response.cookies.set("qxm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Team registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process team registration" },
      { status: 500 }
    );
  }
}
