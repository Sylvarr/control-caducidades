import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import CatalogProduct from "../models/CatalogProduct.js";
import ProductStatus from "../models/Product.js";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener la ruta absoluta al archivo .env
const envPath = path.resolve(__dirname, "../.env");
console.log("Buscando .env en:", envPath);

dotenv.config({ path: envPath });

async function checkProduct() {
  try {
    // Imprimir todas las variables de entorno para debug
    console.log("Variables de entorno:", process.env);

    // Usar la URI directamente si no se puede leer del .env
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/control-caducidades";
    console.log("Usando URI:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI);

    // Buscar el zumo de naranja en el catálogo
    const catalogProduct = await CatalogProduct.findOne({ nombre: /naranja/i });
    console.log("Producto en catálogo:", catalogProduct);

    if (catalogProduct) {
      // Buscar el estado del producto
      const productStatus = await ProductStatus.findOne({
        producto: catalogProduct._id,
      });
      console.log("Estado del producto:", productStatus);
    } else {
      console.log("No se encontró el zumo de naranja en el catálogo");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error completo:", error);
    mongoose.connection.close();
  }
}

checkProduct();
