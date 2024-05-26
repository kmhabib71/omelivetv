const socketIo = require("socket.io");
const { handleSocketConnection } = require("./controllers/matchController");

const socketSetup = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    handleSocketConnection(io, socket);
  });
};

module.exports = socketSetup;
