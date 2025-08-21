const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");
const logger = require("../logger");

// Obtener todos los productos del catálogo
exports.getAllProducts = async (req, res) => {
  try {
    logger.info("Obteniendo todos los productos del catálogo");
    const products = await CatalogProduct.find().sort({ nombre: 1 });
    logger.info(`Se encontraron ${products.length} productos`);
    res.json(products);
  } catch (error) {
    logger.error({ error }, "Error al obtener productos del catálogo");
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
    logger.info(`Producto añadido al catálogo: ${savedProduct.nombre}`);

    const io = req.app.get('io');
    io.emit("catalogUpdate", {
      type: "create",
      product: savedProduct,
    });

    res.status(201).json(savedProduct);
  } catch (error) {
    logger.error({ error, body: req.body }, "Error al añadir producto al catálogo");
    res
      .status(400)
      .json({ message: "Error al añadir producto", error: error.message });
  }
};

const mongoose = require("mongoose");

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    const deletedProduct = await CatalogProduct.findByIdAndDelete(id, { session });

    if (!deletedProduct) {
      await session.abortTransaction();
      session.endSession();
      logger.warn(`Intento de eliminar un producto no encontrado: ${id}`);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await ProductStatus.deleteMany({ producto: id }, { session });

    await session.commitTransaction();
    session.endSession();

    logger.info(`Producto eliminado del catálogo y estados asociados: ${id}`);

    const io = req.app.get('io');
    io.emit("catalogUpdate", {
      type: "delete",
      productId: id,
    });

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error({ error, params: req.params }, "Error al eliminar producto del catálogo");
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
      logger.warn(`Intento de activar/desactivar un producto no encontrado: ${id}`);
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    product.activo = !product.activo;
    const updatedProduct = await product.save();
    logger.info(`Estado del producto actualizado: ${updatedProduct.nombre}, activo: ${updatedProduct.activo}`);

    const io = req.app.get('io');
    io.emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.json(updatedProduct);
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al activar/desactivar producto");
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
      logger.warn(`Intento de actualizar un producto no encontrado: ${id}`);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    logger.info(`Producto actualizado en el catálogo: ${updatedProduct.nombre}`);

    const io = req.app.get('io');
    io.emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.json(updatedProduct);
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, "Error al actualizar producto del catálogo");
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};
