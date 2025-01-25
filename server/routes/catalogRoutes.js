import express from "express";
import { verifyToken, isSupervisor } from "../middleware/auth.js";
import {
  getAllProducts,
  addProduct,
  deleteProduct,
  toggleProductStatus,
  updateProduct,
} from "../controllers/catalogController.js";

const router = express.Router();

// Rutas protegidas con autenticación
router.use(verifyToken);

// Rutas para todos los usuarios autenticados
router.get("/", getAllProducts);

// Rutas solo para supervisores
router.post("/", isSupervisor, addProduct);
router.delete("/:id", isSupervisor, deleteProduct);
router.put("/:id", isSupervisor, updateProduct);
router.put("/:id/toggle", isSupervisor, toggleProductStatus);

export default router;
