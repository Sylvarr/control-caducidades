import mongoose from "mongoose";
import { PRODUCT_STATES } from "../../shared/models/Product.js";
import { toISODateString } from "../../shared/utils/dateUtils.js";

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
      get: (date) => (date ? toISODateString(date) : null),
    },
    fechaAlmacen: {
      type: Date,
      default: null,
      get: (date) => (date ? toISODateString(date) : null),
    },
    fechasAlmacen: {
      type: [Date],
      default: [],
      get: (dates) => dates.map((date) => toISODateString(date)),
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
    version: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Middleware pre-save para manejar versiones
productStatusSchema.pre("save", function (next) {
  try {
    // Si es una actualización (no un documento nuevo), incrementar la versión
    if (!this.isNew) {
      this.version = (this.version || 1) + 1;
      console.log(
        `Incrementando versión del producto ${this._id} a ${this.version}`
      );
    }

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

// Método para validar fechas antes de guardar
productStatusSchema.methods.validateDates = function () {
  const errors = [];

  if (this.fechaFrente && isNaN(new Date(this.fechaFrente).getTime())) {
    errors.push("Fecha de frente inválida");
  }

  if (this.fechaAlmacen && isNaN(new Date(this.fechaAlmacen).getTime())) {
    errors.push("Fecha de almacén inválida");
  }

  if (this.fechasAlmacen && Array.isArray(this.fechasAlmacen)) {
    this.fechasAlmacen.forEach((fecha, index) => {
      if (fecha && isNaN(new Date(fecha).getTime())) {
        errors.push(`Fecha de almacén #${index + 1} inválida`);
      }
    });
  }

  return errors;
};

export default mongoose.model("ProductStatus", productStatusSchema);
