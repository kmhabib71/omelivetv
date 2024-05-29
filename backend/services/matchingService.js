const users = [];
const engagedUsers = {}; // Track engaged users
const engagedPairs = []; // Track engaged pairs

const findMatch = (socket) => {
  console.log("Engaged Users before match: ", engagedUsers);
  const availableUsers = users.filter(
    (user) => user !== socket && !engagedUsers[user.id]
  );
  if (availableUsers.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const match = availableUsers[randomIndex];
    engagedUsers[socket.id] = true;
    engagedUsers[match.id] = true;
    engagedPairs.push({ user1: socket.id, user2: match.id });
    socket.emit("match-found", match.id);
    match.emit("match-found", socket.id);
  }
  console.log("Engaged Users after match: ", engagedUsers);
};

const handleNext = (io, socket) => {
  const pair = engagedPairs.find(
    (pair) => pair.user1 === socket.id || pair.user2 === socket.id
  );

  if (pair) {
    const remoteUserId = pair.user1 === socket.id ? pair.user2 : pair.user1;
    engagedUsers[socket.id] = false;
    engagedUsers[remoteUserId] = false;

    engagedPairs.splice(engagedPairs.indexOf(pair), 1);
    io.to(remoteUserId).emit("user-disconnected", socket.id); // Notify the other user
  }

  findMatch(socket);
};

const handleDisconnect = (io, socket) => {
  console.log("Engaged Users before Disconnect: ", engagedUsers);
  const index = users.indexOf(socket);
  if (index !== -1) {
    users.splice(index, 1);
  }
  delete engagedUsers[socket.id];

  for (let i = engagedPairs.length - 1; i >= 0; i--) {
    if (
      engagedPairs[i].user1 === socket.id ||
      engagedPairs[i].user2 === socket.id
    ) {
      const otherUserId =
        engagedPairs[i].user1 === socket.id
          ? engagedPairs[i].user2
          : engagedPairs[i].user1;
      io.to(otherUserId).emit("user-disconnected", socket.id); // Notify the other user
      engagedPairs.splice(i, 1);
      engagedUsers[otherUserId] = false; // Reset state for remaining user
      findMatch(io.sockets.sockets.get(otherUserId)); // Try to find a new match for the remaining user
      console.log("Engaged Users after Disconnect: ", engagedUsers);
    }
  }
};

const addUser = (socket) => {
  users.push(socket);
  findMatch(socket);
};

const getEngagedPairsService = () => {
  return engagedPairs;
};

const getTargetSocketId = (socketId) => {
  const pair = engagedPairs.find(
    (pair) => pair.user1 === socketId || pair.user2 === socketId
  );
  return pair ? (pair.user1 === socketId ? pair.user2 : pair.user1) : null;
};

module.exports = {
  findMatch,
  handleNext,
  handleDisconnect,
  addUser,
  getEngagedPairsService,
  getTargetSocketId,
};
