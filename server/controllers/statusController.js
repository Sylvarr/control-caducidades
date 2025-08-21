const ProductStatus = require("../models/Product");
const logger = require("../logger");

exports.getAllStatus = async (req, res) => {
  try {
    const statuses = await ProductStatus.find().populate("producto", "nombre");
    res.json(statuses);
  } catch (error) {
    logger.error({ error }, "Error al obtener todos los estados");
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
    logger.error({ error, params: req.params }, "Error al obtener por estado");
    res
      .status(500)
      .json({ message: "Error al obtener por estado", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const {
      fechaFrente,
      fechaAlmacen,
      fechasAlmacen = [],
      cajaUnica,
      hayUnicaCajaActual,
    } = req.body;

    const updateData = {
      fechaFrente,
      fechaAlmacen,
      fechasAlmacen,
      cajaUnica: Boolean(cajaUnica),
      hayUnicaCajaActual: Boolean(hayUnicaCajaActual),
    };

    let productStatus = await ProductStatus.findOne({ producto: productoId });
    const isNew = !productStatus;

    if (productStatus) {
      Object.assign(productStatus, updateData);
    } else {
      productStatus = new ProductStatus({
        producto: productoId,
        ...updateData,
      });
    }

    const savedStatus = await productStatus.save();
    const populatedStatus = await ProductStatus.findById(
      savedStatus._id
    ).populate("producto", "nombre tipo activo");

    logger.info(`Estado del producto actualizado: ${productoId}`);

    const io = req.app.get('io');
    io.emit("productStatusUpdate", {
      type: isNew ? "create" : "update",
      productStatus: populatedStatus,
    });

    res.json(populatedStatus);
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, "Error al actualizar el estado del producto");
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        message: "Error de validación",
        errors: validationErrors,
      });
    }
    res.status(500).json({
      message: "Error al actualizar el estado",
      error: error.message,
    });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const deletedStatus = await ProductStatus.findOneAndDelete({
      producto: productoId,
    });

    if (deletedStatus) {
      logger.info(`Estado del producto eliminado: ${productoId}`);
      const io = req.app.get('io');
      io.emit("productStatusUpdate", {
        type: "delete",
        productId: productoId,
      });
    }

    res.json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al eliminar el estado del producto");
    res.status(400).json({ message: "Error al eliminar el estado" });
  }
};
