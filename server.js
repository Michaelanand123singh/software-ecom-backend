import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";

// INFO: Create express app
const app = express();
const port = process.env.PORT || 4000;

// INFO: Initialize connections with proper error handling
const initializeApp = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully!");
    
    // Connect to Cloudinary
    console.log("☁️  Connecting to Cloudinary...");
    await connectCloudinary();
    console.log("✅ Cloudinary connected successfully!");
    
    console.log("🎉 All services initialized successfully!");
    
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
};

// Initialize connections
initializeApp();

// INFO: Middleware
app.use(express.json());
app.use(cors());

// INFO: Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "API is running...",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// INFO: Database status endpoint
app.get("/api/status", (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      server: "running",
      database: {
        status: states[dbState] || 'unknown',
        name: mongoose.connection.db?.databaseName || 'not connected',
        host: mongoose.connection.host || 'not connected'
      },
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? "configured" : "not configured",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// INFO: API endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);

// INFO: Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// INFO: Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// INFO: Start server
app.listen(port, () => {
  console.log(`🌐 Server is running on port ${port}`);
  console.log(`📍 Local: http://localhost:${port}`);
  console.log(`📍 Status: http://localhost:${port}/api/status`);
});