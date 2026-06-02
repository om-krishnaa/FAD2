import express from "express";
import "dotenv/config";
import cors from "cors";
import { testEmailConfig } from "./utils/mailer";
import { testConnection } from "./config/db";
const path = require("path");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const emailRoutes = require("./routes/mail.route");
const adRoutes = require("./routes/ad_campaigns.route");
const analyticsRoutes = require("./routes/analytic.route");
const paymentRoutes = require("./routes/payment.route");
const settingRoutes = require("./routes/setting.route");
const reportRoutes = require("./routes/report.route");
const referralRoutes = require("./routes/referral.route");
const webhookRoutes = require("./routes/webhook.route");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
// app.use("/uploads", express.static("uploads"));

testConnection();
app.use(
  "/uploads",
  express.static(path.join(path.dirname(__filename), "uploads"))
);

// Routes
app.use("/api/mail", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/webhook", webhookRoutes);

// Health check
app.get("/api/health-check", (req, res) => {
  res.json({ message: "Server working!" });
});

// Serve uploaded files statically

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log("\n🚀 === SERVER STARTED ===");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📧 Real email service configured with Gmail");

  await testEmailConfig();

  console.log("🚀 === SERVER READY ===\n");
});
