const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");
const mongoose = require("mongoose");

// Obtener todos los productos del catálogo
exports.getAllProducts = async (req, res) => {
  try {
    console.log("\n--- Inicio de obtención de productos ---");
    const products = await CatalogProduct.find().sort({ nombre: 1 });
    console.log("Productos encontrados:", products);
    console.log("--- Fin de obtención de productos ---\n");
    res.json(products);
  } catch (error) {
    console.error("Error detallado:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

// Añadir nuevo producto al catálogo
exports.addProduct = async (req, res) => {
  try {
    console.log("\n--- Inicio de creación de producto ---");
    console.log("Datos recibidos:", req.body);

    const { nombre, tipo = "permanente" } = req.body;

    // Verificar si el producto ya existe
    console.log("Buscando producto existente con nombre:", nombre);
    const existingProduct = await CatalogProduct.findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, "i") },
    });
    console.log("Producto existente encontrado:", existingProduct);

    if (existingProduct) {
      console.log("Producto ya existe, retornando error");
      return res.status(400).json({
        message: "Este producto ya existe en el catálogo",
      });
    }

    console.log("Creando nuevo producto con datos:", { nombre, tipo });
    const product = new CatalogProduct({
      nombre,
      tipo,
      activo: true,
    });

    const savedProduct = await product.save();
    console.log("Producto guardado:", savedProduct);
    console.log("--- Fin de creación de producto ---\n");

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error detallado:", error);
    console.error("Stack trace:", error.stack);
    res.status(400).json({
      message: "Error al crear producto",
      error: error.message,
    });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("\n--- Inicio de eliminación de producto ---");
    console.log("ID recibido:", id);
    console.log("Tipo de ID:", typeof id);
    console.log("Params completos:", req.params);
    console.log("URL completa:", req.originalUrl);

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("ID no válido");
      return res.status(400).json({
        message: "ID de producto no válido",
      });
    }

    // Verificar si el producto existe
    const product = await CatalogProduct.findById(id);
    console.log("Producto encontrado:", product);

    if (!product) {
      console.log("Producto no encontrado en catálogo");
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    // Verificar si tiene estados asignados
    const hasStatus = await ProductStatus.findOne({
      producto: id,
    }).lean();

    console.log("Estado encontrado:", hasStatus);

    if (hasStatus) {
      console.log("El producto tiene estados asignados, no se puede eliminar");
      return res.status(400).json({
        message:
          "No se puede eliminar el producto porque tiene estados asignados",
      });
    }

    // Si no tiene estados, eliminar el producto
    console.log("Intentando eliminar el producto del catálogo");
    const result = await CatalogProduct.findByIdAndDelete(id);
    console.log("Resultado de la eliminación:", result);

    if (!result) {
      console.log("No se pudo eliminar el producto");
      return res.status(404).json({
        message: "No se pudo encontrar el producto para eliminar",
      });
    }

    console.log("Producto eliminado exitosamente");
    console.log("--- Fin de eliminación de producto ---\n");

    res.json({
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error detallado:", error);
    console.error("Stack trace:", error.stack);
    res.status(400).json({
      message: "Error al eliminar producto",
      error: error.message,
    });
  }
};

// Desactivar/activar un producto
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await CatalogProduct.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    product.activo = !product.activo;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};
