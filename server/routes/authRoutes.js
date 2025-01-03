const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  loginLimiter,
  verifyToken,
  isSupervisor,
} = require("../middleware/auth");

// Rutas públicas
router.post("/login", loginLimiter, authController.login);

// Rutas protegidas
router.use(verifyToken);

// Rutas para usuarios autenticados
router.get("/me", authController.getCurrentUser);
router.put("/change-password", authController.changePassword);

// Rutas solo para supervisores
router.get("/users", isSupervisor, authController.getAllUsers);
router.post("/users", isSupervisor, authController.createUser);
router.put("/users/:id", isSupervisor, authController.updateUser);
router.delete("/users/:id", isSupervisor, authController.deleteUser);

module.exports = router;
