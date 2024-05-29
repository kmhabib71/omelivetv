import React, { useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css"; // Ensure Tailwind CSS is imported

const socket = io("http://localhost:5000");

function App() {
  const localStream = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    const init = async () => {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localStream.current) {
        document.getElementById("localVideo").srcObject = localStream.current;
        // console.log("localStream.current: ", localStream.current);
      }
    };
    init();

    console.log("Trying to connect to Socket.io server");
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
      console.log("My Socket ID is: ", socket.id);
    });

    socket.on("match-found", async (matchId) => {
      console.log(`Matched with: ${matchId}`);

      await setupWebRTC(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log("Received ICE candidate: ", candidate);
        }
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });

    socket.on("offer", async (offer) => {
      console.log("Received offer: ", offer);
      await init(); // Ensure localStream is initialized for the receiver

      await setupWebRTC(false);

      try {
        console.log("set remotedescription");
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", answer);
        console.log("Sent answer: ", answer);
      } catch (e) {
        console.error("Error handling offer", e);
      }
    });

    socket.on("answer", async (answer) => {
      console.log("Received answer: ", answer);
      try {
        if (peerConnection.current.signalingState === "have-local-offer") {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          console.log("answer set");
        } else {
          console.error(
            "Received answer in wrong state:",
            peerConnection.current.signalingState
          );
        }
      } catch (e) {
        console.error("Error handling answer", e);
      }
    });

    const setupWebRTC = async (createOffer) => {
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

      // Monitor ICE connection state
      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          peerConnection.current.iceConnectionState
        );
        if (
          peerConnection.current.iceConnectionState === "connected" ||
          peerConnection.current.iceConnectionState === "completed"
        ) {
          console.log("ICE connection established successfully.");
          checkIceCandidateState(peerConnection.current);
        }
      };

      // Function to check ICE candidate stats
      function checkIceCandidateState(pc) {
        pc.getStats(null)
          .then((stats) => {
            stats.forEach((report) => {
              if (
                report.type === "candidate-pair" &&
                report.state === "succeeded"
              ) {
                console.log("ICE candidate pair state: connected");
                console.log("Local candidate:", report.localCandidateId);
                console.log("Remote candidate:", report.remoteCandidateId);
              }
            });
          })
          .catch((error) => {
            console.error("Error getting stats:", error);
          });
      }

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", event.candidate);
          console.log("Sent ICE candidate: ", event.candidate);
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (remoteStreamRef.current) {
          remoteStreamRef.current.srcObject = event.streams[0];
          console.log("Received remote stream: ", event.streams[0]);
        }
      };

      // console.log("localStream.current: ", localStream.current);
      if (localStream.current) {
        console.log(
          "PeerConnection before adding localtrack: ",
          peerConnection
        );
        localStream.current.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream.current);
          const senders = peerConnection.current.getSenders();
          console.log(
            "PeerConnection senders after adding local tracks:",
            senders
          );
        });
        console.log("getTracks added in peerConnection");
      } else {
        console.error("Local stream is not initialized");
        return;
      }

      if (createOffer) {
        try {
          const offer = await peerConnection.current.createOffer();

          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", offer);

          console.log("Sent offer: ", offer);
        } catch (e) {
          console.error("Error creating offer", e);
        }
      }
    };

    return () => {
      if (socket.connected) {
        console.log("Disconnecting from Socket.io server");
        socket.disconnect();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, []);

  const handleNext = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
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
        <video
          id="localVideo"
          autoPlay
          playsInline
          muted
          className="w-1/2"></video>
        <video
          ref={remoteStreamRef}
          id="remoteVideo"
          autoPlay
          playsInline
          className="w-1/2"></video>
      </div>
    </div>
  );
}

export default App;
