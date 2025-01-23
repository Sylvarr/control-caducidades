import mongoose from "mongoose";
import { PRODUCT_STATES } from "../../shared/models/Product.js";
import { processProduct } from "../../shared/business/productClassifier.js";

const productStatusSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CatalogProduct",
      required: true,
    },
    fechaFrente: {
      type: Date,
      required: true,
    },
    fechaAlmacen: {
      type: Date,
      default: null,
    },
    fechasAlmacen: {
      type: [Date],
      default: [],
    },
    cajaUnica: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: Object.values(PRODUCT_STATES),
      required: true,
      default: PRODUCT_STATES.SIN_CLASIFICAR,
    },
  },
  {
    timestamps: true,
  }
);

productStatusSchema.pre("save", function (next) {
  try {
    // Usar la lógica compartida para procesar y clasificar el producto
    const processed = processProduct({
      fechaFrente: this.fechaFrente,
      fechaAlmacen: this.fechaAlmacen,
      fechasAlmacen: this.fechasAlmacen,
      cajaUnica: this.cajaUnica,
    });

    // Actualizar el estado
    this.estado = processed.estado;

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

export default mongoose.model("ProductStatus", productStatusSchema);
