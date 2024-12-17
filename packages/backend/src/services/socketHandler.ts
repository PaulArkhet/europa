import { Server } from "socket.io";

export function setupSocket(io: Server) {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("disconnect", () => {
            console.log(`Client ${socket.id} disconnected.`);
        });
    });
}
