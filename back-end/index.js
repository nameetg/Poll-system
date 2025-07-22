import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5050;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://poll-system-neon.vercel.app",
];

app.use(
  cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// In-memory poll object
let poll = {
  question: "Which team won IPL 2025?",
  options: [
    { id: 1, text: "RCB", votes: [] },
    { id: 2, text: "CSK", votes: [] },
    { id: 3, text: "DC", votes: [] },
    { id: 4, text: "PBKS", votes: [] },
  ],
  ans: 1,
};

let messages = [];
let participants = {};

// Middleware to attach user info
io.use((socket, next) => {
  const user = socket.handshake.auth.token;
  if (user) {
    socket.data.user = user;
  }
  next();
});

// Socket.io listeners
io.on("connection", (socket) => {
  const userId = socket.data.user;

  console.log("User connected:", userId);

  socket.emit("message", messages);

  socket.on("register-teacher", ({ id, name }) => {
    if (!participants[socket.id]) {
      participants[socket.id] = {
        id,
        name,
        role: "teacher",
        socketId: socket.id,
      };
      emitParticipants();
    }
  });

  socket.on("register-student", ({ id, name }) => {
    if (!participants[socket.id]) {
      participants[socket.id] = {
        id,
        name,
        role: "student",
        socketId: socket.id,
      };
      emitParticipants();
    }
  });

  socket.on("kick-participant", (targetSocketId) => {
    // 1. Check if the kicker is a teacher
    const kicker = participants[socket.id];
    if (kicker?.role !== "teacher") return;

    // 2. Check if the target exists
    if (!participants[targetSocketId]) return;

    // 3. Force-disconnect the kicked student
    io.to(targetSocketId).emit("you-were-kicked"); // Optional: Notify kicked user
    io.sockets.sockets.get(targetSocketId)?.disconnect(true); // Force disconnect

    // 4. Remove from participants list
    delete participants[targetSocketId];

    // 5. Update all clients
    io.emit("participants-list", Object.values(participants));
  });

  // Send current poll on request
  socket.on("get-poll", () => {
    socket.emit("poll-data", poll);
  });

  // Handle voting
  socket.on("vote", (optionId) => {
    // Remove vote from all options first
    poll.options.forEach((option) => {
      option.votes = option.votes.filter((user) => user !== socket.data.user);
    });

    // Add vote to the selected option
    const option = poll.options.find((o) => o.id === optionId);
    if (option) {
      option.votes.push(socket.data.user);
    }

    io.emit("poll-data", poll);
  });

  // Handle new poll creation
  socket.on("new-poll", (newPoll) => {
    poll = {
      question: newPoll.question,
      options: newPoll.options.map((text, index) => ({
        id: index + 1,
        text,
        votes: [],
      })),
      ans: newPoll.ans,
    };
    console.log("New poll created:", poll);
    io.emit("poll-data", poll); // Broadcast new poll to everyone
  });

  // Handle new message
  socket.on("user-message", ({ message, name }) => {
    let newMsg = {
      text: message,
      user: name,
    };

    messages.push(newMsg);

    // Emit message to all connected clients
    io.emit("message", messages);
  });

  // Add this to your server code:
  socket.on("request-messages", () => {
    socket.emit("message", messages);
  });

  // Log disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    if (participants[socket.id]) {
      // Only emit if was a participant
      delete participants[socket.id];
      emitParticipants();
    }
  });
});

function emitParticipants() {
  const uniqueParticipants = Object.values(participants).reduce(
    (acc, participant) => {
      // Filter duplicates by socket.id or unique ID
      if (!acc.find((p) => p.socketId === participant.socketId)) {
        acc.push(participant);
      }
      return acc;
    },
    []
  );

  io.emit("participants-list", uniqueParticipants);
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
