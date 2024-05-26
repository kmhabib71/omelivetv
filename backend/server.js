const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const users = [];
const engagedUsers = {}; // Track engaged users

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  users.push(socket);

  const findMatch = () => {
    const availableUsers = users.filter(
      (user) => user !== socket && !engagedUsers[user.id]
    );
    if (availableUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      const match = availableUsers[randomIndex];
      console.log(`Matching ${socket.id} with ${match.id}`);
      engagedUsers[socket.id] = true;
      engagedUsers[match.id] = true;
      socket.emit("match-found", match.id);
      match.emit("match-found", socket.id);
    } else {
      console.log("No match found for", socket.id);
    }
  };

  // Handle next button
  socket.on("next", () => {
    console.log(`${socket.id} clicked next`);
    engagedUsers[socket.id] = false;
    findMatch();
  });

  // Initial match attempt
  findMatch();

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected", socket.id, "reason:", reason);
    const index = users.indexOf(socket);
    if (index !== -1) {
      users.splice(index, 1);
    }
    delete engagedUsers[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
