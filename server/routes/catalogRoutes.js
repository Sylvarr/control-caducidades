const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");

// Rutas para el catálogo
router.get("/", catalogController.getAllProducts);
router.post("/", catalogController.addProduct);
router.patch("/:id/toggle", catalogController.toggleProductStatus);

module.exports = router;
