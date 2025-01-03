const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Cargar variables de entorno
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Verificar variables de entorno críticas
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET no está definido en el archivo .env");
  process.exit(1);
}

const catalogRoutes = require("./routes/catalogRoutes");
const statusRoutes = require("./routes/statusRoutes");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging global
app.use((req, res, next) => {
  console.log("\n=== Petición recibida ===");
  console.log("Método:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  console.log("======================\n");
  next();
});

// Rutas
app.use("/api/catalog", catalogRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);

// Manejo de errores global
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log("Ruta no encontrada:", req.originalUrl);
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Conexión a MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/control-caducidades"
  )
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log("Variables de entorno cargadas:", {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET ? "Configurado" : "No configurado",
    MONGODB_URI: process.env.MONGODB_URI ? "Configurado" : "No configurado",
  });
});
