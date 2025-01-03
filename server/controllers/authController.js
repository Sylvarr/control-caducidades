const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      restaurante: user.restaurante,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Intento de login:", { username, password });

    // Validar campos requeridos
    if (!username || !password) {
      console.log("Campos requeridos faltantes");
      return res.status(400).json({
        error: "Usuario y contraseña son requeridos",
      });
    }

    // Buscar usuario
    const user = await User.findOne({ username });
    console.log("Usuario encontrado:", user ? "Sí" : "No");

    if (!user) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    console.log("Verificando contraseña...");
    const isMatch = await user.comparePassword(password);
    console.log("Contraseña válida:", isMatch ? "Sí" : "No");

    if (!isMatch) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Generar token
    const token = generateToken(user);
    console.log("Token generado exitosamente");

    res.json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Error detallado en login:", error);
    res.status(500).json({
      error: "Error al iniciar sesión",
      details: error.message,
    });
  }
};

// Registro (solo supervisores pueden registrar nuevos usuarios)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error de validación",
        details: errors.array(),
      });
    }

    // Verificar que el usuario que hace la petición es supervisor
    if (req.user.role !== "supervisor") {
      return res.status(403).json({
        error: "No tienes permisos para registrar usuarios",
      });
    }

    const { username, password, role } = req.body;

    // Verificar rol válido
    if (!["supervisor", "encargado"].includes(role)) {
      return res.status(400).json({
        error: "Rol no válido",
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "El nombre de usuario ya está en uso",
      });
    }

    // Crear nuevo usuario
    const user = new User({
      username,
      password,
      role,
      restaurante: req.user.restaurante, // Heredar el restaurante del supervisor
    });

    await user.save();

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error al registrar usuario",
    });
  }
};

// Obtener usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(user.toJSON());
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    res.status(500).json({
      error: "Error al obtener usuario",
    });
  }
};

// Obtener todos los usuarios (solo supervisores)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
};

// Eliminar usuario (solo supervisores)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Verificar que no se está intentando eliminar a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({
        error: "No puedes eliminarte a ti mismo",
      });
    }

    // Eliminar usuario
    await User.findByIdAndDelete(userId);

    res.json({
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      error: "Error al eliminar usuario",
    });
  }
};
