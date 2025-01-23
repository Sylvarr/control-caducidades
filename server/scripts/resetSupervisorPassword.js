import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import User from "../models/User.js";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

async function resetSupervisorPassword() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/control-caducidades"
    );
    console.log("Conectado a MongoDB");

    // Buscar el supervisor
    const supervisor = await User.findOne({ role: "supervisor" });
    if (!supervisor) {
      console.log("No se encontró ningún supervisor");
      process.exit(0);
    }

    // Actualizar contraseña usando el modelo para aprovechar el middleware
    supervisor.password = "admin123456";
    await supervisor.save();

    console.log("Contraseña del supervisor restablecida exitosamente");
    console.log("Username:", supervisor.username);
    console.log("Nueva password: admin123456");
    console.log("\nAhora deberías poder iniciar sesión con estas credenciales");

    // Verificar que la contraseña se puede validar
    const isValid = await supervisor.comparePassword("admin123456");
    console.log("Verificación de contraseña:", isValid ? "Exitosa" : "Fallida");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

resetSupervisorPassword();
