const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

// Cargar variables de entorno según el entorno
console.log("Directorio actual:", __dirname);
const envPath = path.join(
  __dirname,
  process.env.NODE_ENV === "production" ? ".env.production" : ".env"
);
console.log("Intentando cargar archivo de variables de entorno:", envPath);

try {
  require("dotenv").config({ path: envPath });
  console.log("Variables de entorno cargadas desde:", envPath);
} catch (error) {
  console.error("Error al cargar variables de entorno:", error);
}

// Verificar variables de entorno requeridas
console.log("Verificando variables de entorno...");
console.log("Variables disponibles:", {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET ? "[PRESENTE]" : "[AUSENTE]",
  MONGODB_URI: process.env.MONGODB_URI ? "[PRESENTE]" : "[AUSENTE]",
  CORS_ORIGIN: process.env.CORS_ORIGIN ? "[PRESENTE]" : "[AUSENTE]",
});

const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "Error: Faltan variables de entorno requeridas:",
    missingEnvVars
  );
  process.exit(1);
}

console.log("Variables de entorno cargadas correctamente");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("JWT_SECRET disponible:", !!process.env.JWT_SECRET);
console.log("MONGODB_URI disponible:", !!process.env.MONGODB_URI);

const catalogRoutes = require("./routes/catalogRoutes");
const statusRoutes = require("./routes/statusRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// Configuración de CORS
const allowedOrigins = [
  "https://control-caducidades-caducidades.up.railway.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.NODE_ENV === "production" ? process.env.RAILWAY_STATIC_URL : null,
  process.env.NODE_ENV === "production"
    ? process.env.RAILWAY_PUBLIC_DOMAIN
    : null,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir solicitudes sin origin
    if (process.env.NODE_ENV !== "production" && !origin) {
      return callback(null, true);
    }

    // En producción, permitir solicitudes del mismo origen
    if (process.env.NODE_ENV === "production" && !origin) {
      return callback(null, true);
    }

    console.log("Origin recibido:", origin);
    console.log("Origins permitidos:", allowedOrigins);

    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.log("Origin bloqueado:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 horas
};

// Aplicar CORS como primer middleware
app.use(cors(corsOptions));

// Configuración de Socket.IO con las mismas opciones CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

// Hacer io accesible globalmente
global.io = io;

// Middleware
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

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

app.use((req, res, next) => {
  console.log("CORS Middleware: Request received for:", req.originalUrl);
  next();
});

// Configurar rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 solicitudes por ventana por IP
  standardHeaders: true, // Devolver info de rate limit en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar los headers `X-RateLimit-*`
  message: {
    error: "Demasiadas solicitudes, por favor intente más tarde.",
    details: "Se ha excedido el límite de solicitudes permitidas.",
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiadas solicitudes, por favor intente más tarde.",
      details: "Se ha excedido el límite de solicitudes permitidas.",
    });
  },
});

// Configurar rate limiter específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos de login por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de inicio de sesión.",
    details: "Por favor, espere antes de intentar nuevamente.",
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiados intentos de inicio de sesión.",
      details: "Por favor, espere antes de intentar nuevamente.",
    });
  },
});

// Aplicar rate limiter global a todas las rutas
app.use(limiter);

// Aplicar rate limiter específico para rutas de autenticación
app.use("/api/auth/login", authLimiter);

// Rutas API
app.use("/api/catalog", catalogRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);

// En producción, todas las rutas no-API sirven el index.html
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    }
  });
}

// Manejo de errores global
app.use((err, req, res, _next) => {
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
      console.log("Intentando conectar a MongoDB...");
      console.log("MONGODB_URI disponible:", !!process.env.MONGODB_URI);
      console.log("NODE_ENV:", process.env.NODE_ENV);

      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("Conectado a MongoDB exitosamente");
      console.log("Base de datos:", mongoose.connection.name);
      console.log("Host:", mongoose.connection.host);

      // Crear usuario admin si no existe
      const User = require("./models/User");
      const adminExists = await User.findOne({ username: "admin" });

      if (!adminExists) {
        console.log("Usuario admin no encontrado, creando...");
        const admin = new User({
          username: "admin",
          password: "admin123456",
          role: "supervisor",
          restaurante: "Restaurante",
        });

        try {
          await admin.save();
          console.log("Usuario admin creado exitosamente");
        } catch (error) {
          console.error("Error al crear usuario admin:", error);
        }
      } else {
        console.log("Usuario admin ya existe");
      }

      break;
    } catch (err) {
      retries++;
      console.error(
        `Error conectando a MongoDB (intento ${retries}/${maxRetries}):`,
        err.message
      );
      console.error("Stack trace:", err.stack);

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
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  });
});

console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
