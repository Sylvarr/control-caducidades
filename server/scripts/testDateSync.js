import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import CatalogProduct from "../models/CatalogProduct.js";
import ProductStatus from "../models/Product.js";
import {
  compareClassifications,
  processProduct,
} from "../../shared/business/productClassifier.js";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

async function testDateSync() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/control-caducidades"
    );
    console.log("Conectado a MongoDB");

    // 1. Crear producto de prueba en el catálogo
    const testProduct = new CatalogProduct({
      nombre: "Producto de Prueba",
      tipo: "permanente",
      activo: true,
    });
    const savedProduct = await testProduct.save();
    console.log("Producto de catálogo creado:", savedProduct);

    // 2. Crear estados con diferentes formatos de fecha
    const testCases = [
      {
        name: "Fechas como strings ISO",
        data: {
          fechaFrente: "2024-02-15",
          fechaAlmacen: "2024-02-16",
          fechasAlmacen: ["2024-02-17"],
          cajaUnica: false,
        },
      },
      {
        name: "Fechas como objetos Date",
        data: {
          fechaFrente: new Date("2024-02-15"),
          fechaAlmacen: new Date("2024-02-16"),
          fechasAlmacen: [new Date("2024-02-17")],
          cajaUnica: false,
        },
      },
      {
        name: "Fechas con horas diferentes",
        data: {
          fechaFrente: "2024-02-15T12:00:00.000Z",
          fechaAlmacen: "2024-02-15T15:30:00.000Z",
          fechasAlmacen: [],
          cajaUnica: true,
        },
      },
    ];

    for (const testCase of testCases) {
      console.log(`\nProbando: ${testCase.name}`);

      // Procesar datos localmente primero
      const localProcessed = processProduct(testCase.data);
      console.log("Estado calculado localmente:", localProcessed.estado);

      const status = new ProductStatus({
        producto: savedProduct._id,
        ...testCase.data,
      });

      // Guardar y recuperar para verificar la normalización
      const savedStatus = await status.save();
      const retrievedStatus = await ProductStatus.findById(
        savedStatus._id
      ).populate("producto");

      console.log("Estado guardado en servidor:", retrievedStatus.estado);

      // Comparar clasificaciones
      const comparison = compareClassifications(
        localProcessed,
        retrievedStatus.toObject()
      );

      console.log("Estado guardado:", retrievedStatus);
      console.log("Comparación:", comparison);

      if (comparison.match) {
        console.log("✅ Test exitoso: Las fechas y estados coinciden");
      } else {
        console.log("❌ Test fallido: Hay diferencias");
        console.log("Diferencias:", comparison.differences);
      }

      // Limpiar
      await ProductStatus.deleteOne({ _id: savedStatus._id });
    }

    // Limpiar producto de catálogo
    await CatalogProduct.deleteOne({ _id: savedProduct._id });

    console.log("\nPruebas completadas");
  } catch (error) {
    console.error("Error en las pruebas:", error);
  } finally {
    await mongoose.connection.close();
  }
}

testDateSync();
