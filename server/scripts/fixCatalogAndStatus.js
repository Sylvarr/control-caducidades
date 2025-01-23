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

async function fixCatalogAndStatus() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/control-caducidades";
    console.log("Conectando a:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI);

    // Primero, eliminar el zumo de naranja existente del catálogo
    await CatalogProduct.deleteOne({ nombre: /naranja/i });

    // Crear nuevo producto en el catálogo
    const newCatalogProduct = new CatalogProduct({
      nombre: "Zumo de naranja",
      activo: true,
      tipo: "permanente",
    });

    const savedCatalogProduct = await newCatalogProduct.save();
    console.log("Producto creado en catálogo:", savedCatalogProduct);

    // Eliminar cualquier estado existente
    await ProductStatus.deleteOne({ producto: savedCatalogProduct._id });

    // Crear nuevo estado
    const newStatus = new ProductStatus({
      producto: savedCatalogProduct._id,
      fechaFrente: new Date("2024-02-01"),
      fechaAlmacen: new Date("2024-02-01"),
      cajaUnica: false,
      hayOtrasFechas: false,
      estado: "sin-clasificar",
    });

    const savedStatus = await newStatus.save();
    console.log("Nuevo estado creado:", savedStatus);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error completo:", error);
    mongoose.connection.close();
  }
}

fixCatalogAndStatus();
