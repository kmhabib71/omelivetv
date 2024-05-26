import React, { useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css"; // Ensure Tailwind CSS is imported

const socket = io("http://localhost:5000");

function App() {
  useEffect(() => {
    console.log("Trying to connect to Socket.io server");
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
      console.log("My Socket ID is: ", socket.id);
    });

    socket.on("match-found", (matchId) => {
      console.log(`Matched with: ${matchId}`);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      if (socket.connected) {
        console.log("Disconnecting from Socket.io server");
        socket.disconnect();
      }
    };
  }, []);

  const handleNext = () => {
    socket.emit("next");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex flex-col items-center space-y-4">
        <div className="text-xl font-medium text-black">P2P WebRTC App</div>
        <p className="text-gray-500">Waiting for a match...</p>
        <button
          onClick={handleNext}
          className="p-2 bg-blue-500 text-white rounded">
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
