import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import rideRoutes from "./routes/rides.js";
import conversationRoutes from "./routes/conversations.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initSocket } from "./socket.js";

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = initSocket(httpServer);
app.set("io", io);

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5174")
  .split(",")
  .map((s) => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// Rate limiting on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, try again later" },
});

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/conversations", conversationRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  BadgerRides API running on port ${PORT}`);
  console.log(`  Socket.IO ready\n`);
});
