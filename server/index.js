const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Cargar variables de entorno
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Verificar variables de entorno críticas
const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI", "NODE_ENV"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    "ERROR: Las siguientes variables de entorno son requeridas pero no están definidas:"
  );
  missingEnvVars.forEach((varName) => console.error(`- ${varName}`));
  process.exit(1);
}

const catalogRoutes = require("./routes/catalogRoutes");
const statusRoutes = require("./routes/statusRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://tudominio.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Hacer io accesible globalmente
global.io = io;

// Configuración de CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://tudominio.com"] // Reemplazar con tu dominio de producción
      : ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 horas
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Middleware de logging global (solo en desarrollo)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log("\n=== Petición recibida ===");
    console.log("Método:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Headers:", req.headers);
    console.log("======================\n");
    next();
  });
}

// Rutas
app.use("/api/catalog", catalogRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Error de validación",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: "Error de duplicado",
      details: "Ya existe un registro con esos datos únicos",
    });
  }

  res.status(500).json({
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log("Ruta no encontrada:", req.originalUrl);
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Configuración de WebSocket
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

// Conexión a MongoDB con retry
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Conectado a MongoDB exitosamente");
      break;
    } catch (err) {
      retries++;
      console.error(
        `Error conectando a MongoDB (intento ${retries}/${maxRetries}):`,
        err
      );
      if (retries === maxRetries) {
        console.error(
          "No se pudo conectar a MongoDB después de múltiples intentos"
        );
        process.exit(1);
      }
      // Esperar 5 segundos antes de reintentar
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectWithRetry();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log("Variables de entorno cargadas:", {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET ? "Configurado" : "No configurado",
    MONGODB_URI: process.env.MONGODB_URI ? "Configurado" : "No configurado",
  });
});
