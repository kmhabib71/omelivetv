const getIceServers = () => {
  return {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "turn:your.turn.server:3478",
        username: "your_username",
        credential: "your_password",
      },
    ],
  };
};

module.exports = { getIceServers };
