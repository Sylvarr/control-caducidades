import express from "express";
import {
  getAllStatus,
  getByStatus,
  updateStatus,
  deleteStatus,
} from "../controllers/statusController.js";

const router = express.Router();

// Asegúrate de que cada ruta corresponde a una función existente en el controlador
router.get("/", getAllStatus);
router.get("/estado/:estado", getByStatus);
router.put("/:productoId", updateStatus);
router.delete("/:productoId", deleteStatus);

export default router;
