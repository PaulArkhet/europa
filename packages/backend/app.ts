import express from "express";
import { mightFail } from "might-fail";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { resetChildServer } from "./src/utils";
import { setupSocket } from "./src/services/socketHandler";
import users from "./routes/users";
import user from "./routes/user";
import projects from "./routes/projects";
import datasets from "./routes/datasets";
import ai from "./routes/ai";
import styleguides from "./routes/styleguides";
import { genParamsSchema, init } from "./src/controllers/ai";
import { readFileSync } from "fs";
import path from "path";

export type BasePage = {
    base64ImageString: string;
    name: string;
};

dotenv.config();
const app = express();
const port = process.env.PORT || 3333;
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("trigger-generation", async (incoming: unknown) => {
        console.log("gen triggered!");
        const { result: genParams, error } = await mightFail(
            genParamsSchema.parseAsync(incoming)
        );

        if (error) {
            return console.error("genParamsSchema incorrect:", error.message);
        }

        init(genParams, socket);
    });

    socket.on("disconnect", () => {
        console.log(`Client ${socket.id} disconnected.`);
    });
});

await resetChildServer();

// Socket.io setup
setupSocket(io);

// Middleware setup
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.use("/api/v0/users", users);
app.use("/api/v0/user", user);
app.use("/api/v0/projects", projects);
app.use("/api/v0/datasets", datasets);
app.use("/api/v0/ai", ai);
app.use("/api/v0/styleguides", styleguides);

app.get("*", (req: Request, res: Response) => {
    res.status(200).sendFile(path.join(frontendPath, "index.html"));
});

// Start server
server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});
