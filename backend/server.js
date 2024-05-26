const express = require("express");
const http = require("http");
const cors = require("cors");
const { connectDB } = require("./config/db");
const socketSetup = require("./socket");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/match", require("./routes/matchRoutes"));

// Socket setup
socketSetup(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
