import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/api/health", async (req, res) => {
  try {
    // Quick test query to ensure database connection is active
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "success",
      message: "Server is running and Database is connected successfully!",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});