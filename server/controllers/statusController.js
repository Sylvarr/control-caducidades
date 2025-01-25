import ProductStatus from "../models/Product.js";
import { processProduct } from "../../shared/business/productClassifier.js";
import CatalogProduct from "../models/CatalogProduct.js";

// Es importante que TODAS las funciones estén definidas
export const getAllStatus = async (req, res) => {
  try {
    const statuses = await ProductStatus.find().populate("producto", "nombre");
    res.json(statuses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener estados", error: error.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const status = await ProductStatus.findOne({
      producto: productoId,
    }).populate("producto", "nombre tipo activo");

    if (!status) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    res.json(status);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener estado", error: error.message });
  }
};

export const getByStatus = async (req, res) => {
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

export const updateStatus = async (req, res) => {
  try {
    console.log("Recibiendo actualización:", {
      productoId: req.params.productoId,
      body: req.body,
    });

    const { productoId } = req.params;

    // Verificar que el producto existe en el catálogo
    const catalogProduct = await CatalogProduct.findById(productoId);
    if (!catalogProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el catálogo" });
    }

    const {
      fechaFrente,
      fechaAlmacen,
      fechasAlmacen = [],
      cajaUnica,
      estado,
    } = req.body;

    let processedData;

    // Si se proporciona un estado explícito y no hay fechas, usar ese estado
    if (estado === "sin-clasificar" && !fechaFrente && !fechaAlmacen) {
      processedData = {
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
      };
    } else {
      // Procesar y validar datos usando la lógica compartida
      processedData = processProduct({
        fechaFrente,
        fechaAlmacen,
        fechasAlmacen,
        cajaUnica: Boolean(cajaUnica),
      });
    }

    console.log("Datos procesados:", processedData);

    // Buscar si ya existe un estado para este producto
    let productStatus = await ProductStatus.findOne({ producto: productoId });

    if (productStatus) {
      console.log("Estado actual encontrado:", productStatus);
      // Actualizar estado existente
      Object.assign(productStatus, processedData);
    } else {
      // Crear nuevo estado
      console.log("Creando nuevo estado con:", processedData);
      productStatus = new ProductStatus({
        producto: productoId,
        ...processedData,
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
    res.status(500).json({
      message: "Error al actualizar el estado",
      error: error.message,
    });
  }
};

export const deleteStatus = async (req, res) => {
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
