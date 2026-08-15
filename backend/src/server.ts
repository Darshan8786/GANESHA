import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/error";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import areaRoutes from "./routes/areaRoutes";
import houseRoutes from "./routes/houseRoutes";
import shopRoutes from "./routes/shopRoutes";
import donationRoutes from "./routes/donationRoutes";
import receiptRoutes from "./routes/receiptRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import settlementRoutes from "./routes/settlementRoutes";
import reportRoutes from "./routes/reportRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import siteRoutes from "./routes/siteRoutes";
import auditRoutes from "./routes/auditRoutes";
import publicRoutes from "./routes/publicRoutes";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "svgb-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/cash-settlements", settlementRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/public", publicRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start();
