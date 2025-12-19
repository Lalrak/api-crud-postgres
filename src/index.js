import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import pool from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import createUserTable from "./data/createUserTable.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Routes
app.use("/api", limiter);
app.use("/api", userRoutes);

// Error handling middleware
app.use(errorHandler);

// Create table before starting server
await createUserTable();

// Testing database connection
if (process.env.NODE_ENV !== "production") {
  app.get("/test-db", async (req, res) => {
    try {
      const result = await pool.query("SELECT current_database()");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Server running
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
