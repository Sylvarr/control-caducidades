const ProductStatus = require("../models/Product");
const CatalogProduct = require("../models/CatalogProduct");

// Es importante que TODAS las funciones estén definidas
exports.getAllStatus = async (req, res) => {
  try {
    const statuses = await ProductStatus.find().populate("producto", "nombre");
    res.json(statuses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener estados", error: error.message });
  }
};

exports.getByStatus = async (req, res) => {
  try {
    const { estado } = req.params;
    const statuses = await ProductStatus.find({ estado }).populate(
      "producto",
      "nombre"
    );
    res.json(statuses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener por estado", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    console.log("Recibiendo actualización:", {
      productoId: req.params.productoId,
      body: req.body,
    });

    const { productoId } = req.params;
    const updateData = {
      ...req.body,
      estado: "sin-clasificar", // Aseguramos que tenga un estado inicial
    };

    // Buscar si ya existe un estado para este producto
    let productStatus = await ProductStatus.findOne({ producto: productoId });

    if (productStatus) {
      console.log("Estado actual encontrado:", productStatus);
      // Actualizar estado existente
      console.log("Actualizando estado existente con:", updateData);
      Object.assign(productStatus, updateData);
    } else {
      // Crear nuevo estado
      console.log("Creando nuevo estado con:", updateData);
      productStatus = new ProductStatus({
        producto: productoId,
        ...updateData,
      });
    }

    try {
      // Intentar guardar y capturar cualquier error de validación
      const savedStatus = await productStatus.save();

      // Obtener el estado con la información completa del producto
      const populatedStatus = await ProductStatus.findById(
        savedStatus._id
      ).populate("producto", "nombre tipo activo");

      console.log("Estado guardado y poblado:", populatedStatus);

      // Usar la instancia global de Socket.IO
      if (global.io) {
        global.io.emit("productStatusUpdate", {
          type: productStatus.isNew ? "create" : "update",
          productStatus: populatedStatus,
        });
      }

      res.json(populatedStatus);
    } catch (saveError) {
      console.error("Error al guardar el estado:", saveError);
      if (saveError.errors) {
        const validationErrors = Object.keys(saveError.errors).map((key) => ({
          field: key,
          message: saveError.errors[key].message,
        }));
        return res.status(400).json({
          message: "Error de validación",
          errors: validationErrors,
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error en updateStatus:", error);
    res.status(400).json({
      message: "Error al actualizar estado",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const deletedStatus = await ProductStatus.findOneAndDelete({
      producto: productoId,
    });

    if (deletedStatus && global.io) {
      // Usar la instancia global de Socket.IO
      global.io.emit("productStatusUpdate", {
        type: "delete",
        productId: productoId,
      });
    }

    res.json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ message: "Error al eliminar el estado" });
  }
};
