import express from "express";
import { loginLimiter, verifyToken, isSupervisor } from "../middleware/auth.js";
import {
  login,
  getCurrentUser,
  changePassword,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";

const router = express.Router();

// Health check endpoint (debe estar antes del middleware de autenticación)
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Rutas públicas
router.post("/login", loginLimiter, login);

// Rutas protegidas
router.use(verifyToken);

// Rutas para usuarios autenticados
router.get("/me", getCurrentUser);
router.put("/change-password", changePassword);

// Rutas solo para supervisores
router.get("/users", isSupervisor, getAllUsers);
router.post("/users", isSupervisor, createUser);
router.put("/users/:id", isSupervisor, updateUser);
router.delete("/users/:id", isSupervisor, deleteUser);

export default router;
