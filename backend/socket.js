const socketIo = require("socket.io");
const {
  addUser,
  handleNext,
  handleDisconnect,
  getTargetSocketId,
} = require("./services/matchingService");

const socketSetup = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    addUser(socket);

    socket.on("next", () => {
      handleNext(socket);
    });

    socket.on("ice-candidate", (candidate) => {
      const targetSocketId = getTargetSocketId(socket.id);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", candidate);
      }
    });

    socket.on("disconnect", (reason) => {
      handleDisconnect(socket);
      console.log("Client disconnected", socket.id, "reason:", reason);
    });
  });
};

module.exports = socketSetup;
