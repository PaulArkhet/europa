import express from "express"; // Import necessary types
import type { Request, Response, NextFunction } from "express";
import { init, initChat, uploadStyleGuide } from "../src/controllers/ai";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { Server } from "socket.io";

const ai = express.Router();
let io: Server | null = null;

// Helper to set the Socket.IO server instance dynamically
export const setSocketServer = (socketServer: Server): void => {
  io = socketServer;
};

// Middleware to ensure `io` is initialized
const ensureSocketServer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("here");
  if (!io) {
    res.status(500).json({ error: "Socket.IO server not initialized" });
    return;
  }
  next();
};

// File upload setup
const uploadDir = path.join(__dirname, "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

//@ts-ignore
ai.route("/").post(init).get();
//@ts-ignore
ai.route("/claude-chat").post(initChat);

ai.post(
  "/styleguide",
  ensureSocketServer, // Ensure Socket.IO is available
  upload.single("uploadedFiles"), // Multer middleware for file upload
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!io) {
      res.status(500).json({
        error: "Socket.IO server is not available",
      });
      return; // Explicitly return to avoid further execution
    }
    try {
      debugger;
      await uploadStyleGuide(req, res, io);
    } catch (error) {
      next(error); // Forward error to the global error handler
    }
  }
);

export default ai;
