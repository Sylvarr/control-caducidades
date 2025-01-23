import express from "express";
import { verifyToken, isSupervisor } from "../middleware/auth.js";
import {
  getAllProducts,
  addProduct,
  deleteProduct,
  toggleProductStatus,
} from "../controllers/catalogController.js";

const router = express.Router();

// Middleware de logging para depuración
router.use((req, res, next) => {
  console.log("\n=== Petición a Catalog Router ===");
  console.log("Método:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("=================================\n");
  next();
});

// Rutas públicas (requieren autenticación)
router.get("/", verifyToken, getAllProducts);

// Rutas protegidas (solo supervisores)
router.post("/", [verifyToken, isSupervisor], addProduct);
router.delete("/:id", [verifyToken, isSupervisor], deleteProduct);
router.patch("/:id/toggle", [verifyToken, isSupervisor], toggleProductStatus);

export default router;
