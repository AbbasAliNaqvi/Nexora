require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nexora-cloud.vercel.app",
      "https://nexora-abbasali.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/projects", require("./routes/project.routes"));
app.use("/api/endpoints", require("./routes/endpoint.routes"));
app.use('/api/keys', require('./routes/key.routes'));
app.use('/api/usage',  require('./routes/usage.routes'));
app.use('/gateway',    require('./routes/gateway.routes'));
app.use('/api/ai',        require('./routes/ai.routes'));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Nexora API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`\nNexora server running on ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;