import mongoose from "mongoose";
import {
  PRODUCT_TYPES,
  PRODUCT_LOCATIONS,
} from "../../shared/models/Product.js";

const catalogProductSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    tipo: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      default: PRODUCT_TYPES.PERMANENTE,
    },
    ubicacion: {
      type: String,
      enum: Object.values(PRODUCT_LOCATIONS),
      default: PRODUCT_LOCATIONS.ALMACEN,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CatalogProduct", catalogProductSchema);
