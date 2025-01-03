const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const catalogRoutes = require("./routes/catalogRoutes");
const statusRoutes = require("./routes/statusRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/catalog", catalogRoutes);
app.use("/api/status", statusRoutes);

mongoose
  .connect("mongodb://localhost:27017/control-caducidades")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
