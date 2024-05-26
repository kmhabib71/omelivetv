const users = [];
const engagedUsers = {}; // Track engaged users
const engagedPairs = []; // Track engaged pairs

const handleSocketConnection = (io, socket) => {
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
      engagedPairs.push({ user1: socket.id, user2: match.id });
      console.log("Current engaged pairs:", engagedPairs);
      socket.emit("match-found", match.id);
      match.emit("match-found", socket.id);
    } else {
      console.log("No match found for", socket.id);
    }
  };

  // Handle next button
  socket.on("next", () => {
    console.log(`${socket.id} clicked next`);

    // Find the pair involving this socket
    const pair = engagedPairs.find(
      (pair) => pair.user1 === socket.id || pair.user2 === socket.id
    );

    if (pair) {
      // Find the other user in the pair
      const remoteUserId = pair.user1 === socket.id ? pair.user2 : pair.user1;
      engagedUsers[socket.id] = false;
      engagedUsers[remoteUserId] = false;

      // Remove the pair from engagedPairs
      engagedPairs.splice(engagedPairs.indexOf(pair), 1);
      console.log("Current engaged pairs:", engagedPairs);
    }

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

    // Remove from engaged pairs
    for (let i = engagedPairs.length - 1; i >= 0; i--) {
      if (
        engagedPairs[i].user1 === socket.id ||
        engagedPairs[i].user2 === socket.id
      ) {
        engagedPairs.splice(i, 1);
      }
    }
    console.log("Current engaged pairs:", engagedPairs);
  });
};

// Define the getEngagedPairs function
const getEngagedPairs = (req, res) => {
  res.json(engagedPairs);
};

module.exports = {
  handleSocketConnection,
  getEngagedPairs,
};
