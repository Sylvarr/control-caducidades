const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("Cargando modelo de Usuario...");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El nombre de usuario debe tener al menos 3 caracteres"],
      maxlength: [
        20,
        "El nombre de usuario no puede tener más de 20 caracteres",
      ],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message:
          "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos",
      },
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["supervisor", "encargado"],
        message: "El rol debe ser supervisor o encargado",
      },
      required: [true, "El rol es obligatorio"],
    },
    restaurante: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para hashear la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  console.log("Pre-save middleware ejecutándose...");
  if (!this.isModified("password")) {
    console.log("Contraseña no modificada, saltando hash");
    return next();
  }

  try {
    console.log("Generando salt para hash...");
    const salt = await bcrypt.genSalt(10);
    console.log("Salt generado exitosamente");

    console.log("Hasheando contraseña...");
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Contraseña hasheada exitosamente");

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("Comparando contraseñas...");
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(
      "Resultado de comparación:",
      isMatch ? "Coinciden" : "No coinciden"
    );
    return isMatch;
  } catch (error) {
    console.error("Error al comparar contraseñas:", error);
    throw new Error("Error al comparar contraseñas");
  }
};

// Método para devolver el usuario sin campos sensibles
userSchema.methods.toJSON = function () {
  console.log("Transformando usuario para JSON...");
  const user = this.toObject();
  delete user.password;
  return user;
};

console.log("Modelo de Usuario configurado exitosamente");

module.exports = mongoose.model("User", userSchema);
