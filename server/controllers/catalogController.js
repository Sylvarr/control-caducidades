const CatalogProduct = require("../models/CatalogProduct");

// Obtener todos los productos del catálogo
exports.getAllProducts = async (req, res) => {
  try {
    const products = await CatalogProduct.find().sort({ nombre: 1 }); // Ordenados alfabéticamente
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener productos", error: error.message });
  }
};

// Añadir nuevo producto al catálogo
exports.addProduct = async (req, res) => {
  try {
    const { nombre, tipo = "promocional" } = req.body;

    // Verificar si el producto ya existe
    const existingProduct = await CatalogProduct.findOne({ nombre });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: "Este producto ya existe en el catálogo" });
    }

    const product = new CatalogProduct({
      nombre,
      tipo,
      activo: true,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear producto", error: error.message });
  }
};

// Desactivar un producto
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await CatalogProduct.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    product.activo = !product.activo;
    await product.save();

    res.json(product);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al actualizar producto", error: error.message });
  }
};
