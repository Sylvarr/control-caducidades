const mongoose = require("mongoose");

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
    cajaUnica: {
      type: Boolean,
      default: false,
    },
    hayOtrasFechas: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: [
        "sin-clasificar",
        "frente-agota",
        "frente-cambia",
        "abierto-cambia",
        "abierto-agota",
      ],
      required: true,
      default: "sin-clasificar",
    },
  },
  {
    timestamps: true,
  }
);

productStatusSchema.pre("save", function (next) {
  console.log("Pre-save middleware ejecutándose con datos:", {
    fechaFrente: this.fechaFrente,
    fechaAlmacen: this.fechaAlmacen,
    cajaUnica: this.cajaUnica,
    hayOtrasFechas: this.hayOtrasFechas,
    estado: this.estado,
  });

  try {
    // Si no hay fecha de almacén, es "frente-agota"
    if (!this.fechaAlmacen) {
      console.log("Estableciendo estado: frente-agota (sin fecha almacén)");
      this.estado = "frente-agota";
      return next();
    }

    // Si las fechas son diferentes, es "frente-cambia"
    if (this.fechaFrente.getTime() !== this.fechaAlmacen.getTime()) {
      console.log("Estableciendo estado: frente-cambia (fechas diferentes)");
      this.estado = "frente-cambia";
      return next();
    }

    // Si las fechas coinciden
    if (this.fechaFrente.getTime() === this.fechaAlmacen.getTime()) {
      if (this.cajaUnica) {
        // Si es la última caja y las fechas coinciden
        console.log(
          "Estableciendo estado: abierto-agota (fechas iguales y última caja)"
        );
        this.estado = "abierto-agota";
      } else if (this.hayOtrasFechas) {
        // Si hay otras fechas pero no es la última caja
        console.log("Estableciendo estado: abierto-cambia (hay otras fechas)");
        this.estado = "abierto-cambia";
      } else {
        // Si las fechas coinciden pero no es última caja ni hay otras fechas
        console.log(
          "Estableciendo estado: sin-clasificar (fechas iguales, sin condiciones especiales)"
        );
        this.estado = "sin-clasificar";
      }
    }

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

module.exports = mongoose.model("ProductStatus", productStatusSchema);
