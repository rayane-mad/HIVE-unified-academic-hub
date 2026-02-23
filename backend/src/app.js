const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- IMPORTS ---
// 1. Import the Auth Middleware (The Guard)
// Make sure you created this file in src/middleware/authMiddleware.js
const authenticateToken = require("./middleware/authMiddleware");

// 2. Import Routes
// Ensure you have moved auth.js to src/routes/auth.js so this path works
const authRoutes = require("./routes/auth");
const integrationRoutes = require("./routes/integrationRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

// --- ROUTES ---

// A. Public Routes (No Login Required)
app.use("/api/auth", authRoutes);

// B. Protected Routes (Login Required)
app.use("/api/integration", require("./routes/oauthRoutes")); // Public OAuth Routes (Must be BEFORE auth middleware)
app.use("/api/integration", authenticateToken, integrationRoutes);
app.use("/api/assignments", authenticateToken, assignmentRoutes);
app.use("/api/users", authenticateToken, require("./routes/userRoutes"));
app.use("/api/notifications", authenticateToken, require("./routes/notificationRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Hive Integration API is running",
    version: "1.0.0",
    status: "active",
    endpoints: [
      "POST /api/auth/signup",
      "POST /api/auth/login",
      "GET /api/integration/feed",
      "GET /api/integration/test",
      "POST /api/assignments/submit/:id"
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Hive Integration API running on http://localhost:${PORT}`);
});