import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import CatalogProduct from "../models/CatalogProduct.js";
import ProductStatus from "../models/Product.js";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

async function deleteProductStatus() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/control-caducidades";
    console.log("Conectando a:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI);

    // Buscar el zumo de naranja
    const catalogProduct = await CatalogProduct.findOne({ nombre: /naranja/i });
    console.log("Producto encontrado:", catalogProduct);

    if (catalogProduct) {
      // Eliminar el estado actual
      const result = await ProductStatus.findOneAndDelete({
        producto: catalogProduct._id,
      });
      console.log("Estado eliminado:", result);

      // Crear un nuevo estado
      const newStatus = new ProductStatus({
        producto: catalogProduct._id,
        fechaFrente: new Date("2024-02-01"),
        fechaAlmacen: new Date("2024-02-01"),
        cajaUnica: false,
        hayOtrasFechas: false,
        estado: "sin-clasificar",
      });

      await newStatus.save();
      console.log("Nuevo estado creado:", newStatus);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error completo:", error);
    mongoose.connection.close();
  }
}

deleteProductStatus();
