import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { promisify } from "util";

// Rate limiter para intentos de login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error:
      "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.",
  },
});

// Verificar token JWT
export const verifyToken = async (req, res, next) => {
  try {
    console.log("\n=== Verificando Token ===");
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);

    const token = authHeader?.split(" ")[1];
    console.log("Token extraído:", token ? "Presente" : "No presente");

    if (!token) {
      console.log("No se proporcionó token");
      return res.status(401).json({
        error: "No autorizado - Token no proporcionado",
      });
    }

    // Verificar token
    console.log("Intentando verificar token...");
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log("Token verificado. Usuario:", {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    });

    // Añadir usuario decodificado a la request
    req.user = decoded;
    console.log("=== Fin de verificación ===\n");
    next();
  } catch (error) {
    console.error("Error al verificar token:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
      });
    }

    return res.status(401).json({
      error: "Token inválido",
    });
  }
};

// Middleware para verificar rol de supervisor
export const isSupervisor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "No autorizado",
    });
  }

  if (req.user.role !== "supervisor") {
    return res.status(403).json({
      error: "Acceso denegado - Se requiere rol de supervisor",
    });
  }

  next();
};

// Middleware de manejo de errores
export const errorHandler = (err, req, res, _next) => {
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
};
