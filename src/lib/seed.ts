import connectToDatabase from "../lib/mongodb";
import { User } from "../models/User";
import { Team } from "../models/Team";
import { Student } from "../models/Student";
import { Payment } from "../models/Payment";
import { RegistrationSettings, PaymentSettings } from "../models/Settings";
import { Counter } from "../models/Counter";
import { hashPassword } from "../lib/auth";

export async function seedDatabase() {
  await connectToDatabase();
  console.log("🌱 Seeding Quantex Mugen Database...");

  // 1. Initialize Settings
  await RegistrationSettings.findOneAndUpdate(
    { _id: "DEFAULT_REG_SETTINGS" },
    {
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
    },
    { upsert: true }
  );

  await PaymentSettings.findOneAndUpdate(
    { _id: "DEFAULT_PAYMENT_SETTINGS" },
    {
      _id: "DEFAULT_PAYMENT_SETTINGS",
      upiId: "owaspkare@icici",
      paymentQrUrl: "/assets/payment-qr.png",
      participantFee: 350,
      teamFee: 1400,
    },
    { upsert: true }
  );

  // 2. Initialize Counter
  await Counter.findOneAndUpdate(
    { _id: "QUANTEX_MUGEN" },
    { $setOnInsert: { sequence: 1 } },
    { upsert: true }
  );

  // 3. Create Admin Account
  const adminPassword = await hashPassword("Admin@KLU2026");
  await User.findOneAndUpdate(
    { email: "admin@klu.ac.in" },
    {
      email: "admin@klu.ac.in",
      password: adminPassword,
      name: "Quantex Admin Lead",
      role: "ADMIN",
    },
    { upsert: true }
  );

  console.log("✅ Admin Account ready: admin@klu.ac.in / Admin@KLU2026");

  // 4. Create Sample Verified Team (QXM-001)
  const leadPassword = await hashPassword("Lead@KLU2026");
  const leadUser = await User.findOneAndUpdate(
    { email: "2100030001@klu.ac.in" },
    {
      email: "2100030001@klu.ac.in",
      password: leadPassword,
      name: "Venkat Raghavan",
      role: "STUDENT",
      teamId: "QXM-001",
    },
    { upsert: true, new: true }
  );

  const sampleMembers = [
    {
      name: "Venkat Raghavan",
      registrationNumber: "2100030001",
      generatedCollegeEmail: "2100030001@klu.ac.in",
      department: "CSE" as const,
      year: "III" as const,
      section: "S-14",
      mobile: "9876543210",
      gender: "Male" as const,
      accommodation: "Hosteller" as const,
      hostel: "MH-2",
      roomNumber: "304",
      teamId: "QXM-001",
    },
    {
      name: "Ananya Sharma",
      registrationNumber: "2100030002",
      generatedCollegeEmail: "2100030002@klu.ac.in",
      department: "CSE" as const,
      year: "III" as const,
      section: "S-14",
      mobile: "9876543211",
      gender: "Female" as const,
      accommodation: "Hosteller" as const,
      hostel: "LH-1",
      roomNumber: "201",
      teamId: "QXM-001",
    },
    {
      name: "Karthik Raja",
      registrationNumber: "2100030003",
      generatedCollegeEmail: "2100030003@klu.ac.in",
      department: "ECE" as const,
      year: "III" as const,
      section: "S-08",
      mobile: "9876543212",
      gender: "Male" as const,
      accommodation: "Day Scholar" as const,
      teamId: "QXM-001",
    },
    {
      name: "Pooja Reddy",
      registrationNumber: "2100030004",
      generatedCollegeEmail: "2100030004@klu.ac.in",
      department: "IT" as const,
      year: "III" as const,
      section: "S-03",
      mobile: "9876543213",
      gender: "Female" as const,
      accommodation: "Day Scholar" as const,
      teamId: "QXM-001",
    },
  ];

  await Team.findOneAndUpdate(
    { teamId: "QXM-001" },
    {
      teamId: "QXM-001",
      teamName: "NullByte Vanguard",
      teamLeadId: leadUser._id,
      teamLeadEmail: "2100030001@klu.ac.in",
      members: sampleMembers,
      paymentStatus: "VERIFIED",
    },
    { upsert: true }
  );

  for (const m of sampleMembers) {
    await Student.findOneAndUpdate(
      { registrationNumber: m.registrationNumber },
      m,
      { upsert: true }
    );
  }

  await Payment.findOneAndUpdate(
    { teamId: "QXM-001" },
    {
      teamId: "QXM-001",
      amount: 1400,
      utr: "419827361928",
      screenshotUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      paymentStatus: "VERIFIED",
      verifiedBy: "admin@klu.ac.in",
      verifiedAt: new Date(),
    },
    { upsert: true }
  );

  console.log("✅ Sample Verified Team QXM-001 seeded successfully!");
}
