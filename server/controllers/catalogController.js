const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");

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
    const newProduct = new CatalogProduct(req.body);
    const savedProduct = await newProduct.save();

    // Emitir evento de actualización usando la instancia global
    if (global.io) {
      global.io.emit("catalogUpdate", {
        type: "create",
        product: savedProduct,
      });
    }

    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al añadir producto", error: error.message });
  }
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await CatalogProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Eliminar estados asociados
    await ProductStatus.deleteMany({ producto: id });

    // Emitir evento de actualización usando la instancia global
    if (global.io) {
      global.io.emit("catalogUpdate", {
        type: "delete",
        productId: id,
      });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al eliminar producto", error: error.message });
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
    const updatedProduct = await product.save();

    // Emitir evento de actualización usando la instancia global
    if (global.io) {
      global.io.emit("catalogUpdate", {
        type: "update",
        product: updatedProduct,
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

// Actualizar un producto del catálogo
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Asegurarse de que no se actualicen propiedades como _id, createdAt, etc.
    const allowedUpdates = ['nombre', 'tipo', 'activo'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }
    
    const updatedProduct = await CatalogProduct.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Emitir evento de actualización usando la instancia global
    if (global.io) {
      global.io.emit("catalogUpdate", {
        type: "update",
        product: updatedProduct,
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};
