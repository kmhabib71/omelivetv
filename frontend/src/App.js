import React, { useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css"; // Ensure Tailwind CSS is imported

const socket = io("http://localhost:5000");

function App() {
  const localStream = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    console.log("Trying to connect to Socket.io server");
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
      console.log("My Socket ID is: ", socket.id);
    });

    socket.on("match-found", async (matchId) => {
      console.log(`Matched with: ${matchId}`);
      await setupWebRTC();
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });

    return () => {
      if (socket.connected) {
        console.log("Disconnecting from Socket.io server");
        socket.disconnect();
      }
    };
  }, []);

  const setupWebRTC = async () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:your.turn.server:3478",
          username: "your_username",
          credential: "your_password",
        },
      ],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    if (localStream.current) {
      document.getElementById("localVideo").srcObject = localStream.current;
    }
  };

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
        <video id="localVideo" autoPlay playsInline className="w-1/2"></video>
      </div>
    </div>
  );
}

export default App;
