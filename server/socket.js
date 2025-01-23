import { Server } from "socket.io";

let io = null;

export function setupSocket(server, allowedOrigins) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
  });

  // Mantener la referencia global para la sincronización offline/online
  global.io = io;

  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    socket.on("productStatusUpdate", (data) => {
      console.log("Actualización de estado recibida:", data);
      io.emit("productStatusUpdate", data);
    });

    socket.on("catalogUpdate", (data) => {
      console.log("Actualización de catálogo recibida:", data);
      io.emit("catalogUpdate", data);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado");
    });
  });

  return io;
}
