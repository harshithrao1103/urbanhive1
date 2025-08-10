import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";

import projectRouter from "./routes/project.route.js";
import userRouter from "./routes/user.route.js";
import paymentRouter from "./routes/payment.route.js";
import resourceRouter from "./routes/resource.route.js";
import issueRouter from "./routes/issue.route.js";
import geminiRouter from "./routes/gemini.route.js";
import locationRouter from "./routes/location.route.js";
import emergencyRouter from "./routes/emergency.route.js";
import chatRouter from "./routes/chat.route.js";
import uploadRouter from "./routes/upload.route.js";

//import uploadToS3 from "./utils/AWSUpload.js";
import connectDb from "./utils/connectDb.js";
import chatSocket from "./sockets/chatSocket.js";

const app = express();
const server = http.createServer(app);

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://civic-sphere.vercel.app",
];

// ✅ CORS middleware (apply only once)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// ✅ Session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }, // Set secure: true in production
  })
);

// ✅ Setup multer for uploads
//const upload = multer({ storage: multer.memoryStorage() });

// ✅ Initialize Socket.IO with proper CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Connect to MongoDB
connectDb();

// ✅ Attach socket handlers
chatSocket(io);

// ✅ Routes
app.get("/", (req, res) => {
  res.json({ message: "Server is alive" });
});



app.use("/api/auth", userRouter);
app.use("/api/project", projectRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/issues", issueRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/location", locationRouter);
app.use("/api/gemini", geminiRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/chat", chatRouter);
app.use("/api/v1", uploadRouter);

// ✅ Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
// app.post("/api/v1/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
//     const fileUrl = await uploadToS3(req.file);
//     res.status(200).json({ fileUrl });
//   } catch (error) {
//     console.error("Upload Error:", error);
//     res.status(500).json({ error: "File upload failed" });
//   }
// });