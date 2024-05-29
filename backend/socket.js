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
      handleNext(io, socket);
    });

    socket.on("ice-candidate", (candidate) => {
      const targetSocketId = getTargetSocketId(socket.id);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", candidate);
      }
    });

    socket.on("offer", (offer) => {
      const targetSocketId = getTargetSocketId(socket.id);
      if (targetSocketId) {
        io.to(targetSocketId).emit("offer", offer);
      }
    });

    socket.on("answer", (answer) => {
      const targetSocketId = getTargetSocketId(socket.id);
      if (targetSocketId) {
        io.to(targetSocketId).emit("answer", answer);
      }
    });

    socket.on("disconnect", (reason) => {
      handleDisconnect(io, socket);
      console.log("Client disconnected", socket.id, "reason:", reason);
    });
  });
};

module.exports = socketSetup;
