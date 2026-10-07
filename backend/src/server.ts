import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

import authRoutes from "./routes/authRoutes";
import capacityRoutes from "./routes/capacityRoutes";
import teamRoutes from "./routes/teamRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import adminRoutes from "./routes/adminRoutes";
import { getPublicRules } from "./controllers/adminController";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// High performance response compression for 500+ concurrent users
app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl) or frontend origin
      if (!origin || origin === CLIENT_URL || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Security & Performance Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Database Connection
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/capacity", capacityRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.get("/api/rules", getPublicRules);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Quantex Mugen Backend API",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Quantex Mugen API] Server running on http://localhost:${PORT}`);
});
