const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Login
exports.login = async (req, res) => {
  try {
    console.log("Inicio de solicitud de login");
    const { username, password } = req.body;
    console.log("Datos recibidos:", { username, password: "***" });

    // Validar entrada
    if (!username || !password) {
      console.log("Error: Faltan credenciales");
      return res.status(400).json({
        error: "Usuario y contraseña son requeridos",
      });
    }

    // Buscar usuario
    console.log("Buscando usuario en la base de datos...");
    const user = await User.findOne({ username }).select("+password");
    console.log("Usuario encontrado:", user ? "Sí" : "No");

    if (!user) {
      console.log("Error: Usuario no encontrado");
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    console.log("Verificando contraseña...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Contraseña válida:", isMatch ? "Sí" : "No");

    if (!isMatch) {
      console.log("Error: Contraseña incorrecta");
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Generar token
    console.log("Generando token JWT...");
    console.log("JWT_SECRET disponible:", !!process.env.JWT_SECRET);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET no está definido");
      return res.status(500).json({
        error: "Error de configuración del servidor",
        details: "JWT_SECRET no está configurado",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Token generado exitosamente");

    // Enviar respuesta
    console.log("Enviando respuesta exitosa");
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    const errorInfo = {
      message: error.message,
      type: error.name,
      code: error.code,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
        MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      },
    };

    console.error("Error detallado en login:", errorInfo);
    console.error("Stack trace:", error.stack);

    // Siempre devolver los detalles del error
    return res.status(500).json(errorInfo);
  }
};

// Obtener usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    res.status(500).json({
      error: "Error al obtener usuario",
    });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validar entrada
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Contraseña actual y nueva son requeridas",
      });
    }

    // Buscar usuario
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Contraseña actual incorrecta",
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      error: "Error al cambiar contraseña",
    });
  }
};

// Obtener todos los usuarios (solo supervisor)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
};

// Crear usuario (solo supervisor)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, restaurante } = req.body;
    console.log("Datos recibidos:", { username, role, restaurante });

    // Validar entrada
    if (!username || !password || !role || !restaurante) {
      console.log("Campos faltantes:", {
        username: !username,
        password: !password,
        role: !role,
        restaurante: !restaurante,
      });
      return res.status(400).json({
        error: "Todos los campos son requeridos",
        details: {
          username: !username ? "Falta el nombre de usuario" : null,
          password: !password ? "Falta la contraseña" : null,
          role: !role ? "Falta el rol" : null,
          restaurante: !restaurante ? "Falta el restaurante" : null,
        },
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("Usuario existente encontrado:", existingUser.username);
      return res.status(400).json({
        error: "El usuario ya existe",
      });
    }

    // Crear usuario
    const user = new User({
      username,
      password,
      role,
      restaurante,
    });

    try {
      await user.save();
      console.log("Usuario creado exitosamente:", user);

      res.status(201).json({
        message: "Usuario creado correctamente",
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          restaurante: user.restaurante,
        },
      });
    } catch (saveError) {
      console.error("Error al guardar usuario:", saveError);
      if (saveError.name === "ValidationError") {
        return res.status(400).json({
          error: "Error de validación",
          details: Object.values(saveError.errors).map((err) => err.message),
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error detallado al crear usuario:", error);
    res.status(500).json({
      error: "Error al crear usuario",
      details: error.message,
    });
  }
};

// Actualizar usuario (solo supervisor)
exports.updateUser = async (req, res) => {
  try {
    const { username, role } = req.body;
    const userId = req.params.id;

    // Validar entrada
    if (!username || !role) {
      return res.status(400).json({
        error: "Nombre de usuario y rol son requeridos",
      });
    }

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Actualizar usuario
    user.username = username;
    user.role = role;
    await user.save();

    res.json({
      message: "Usuario actualizado correctamente",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      error: "Error al actualizar usuario",
    });
  }
};

// Eliminar usuario (solo supervisor)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // No permitir eliminar al último supervisor
    if (user.role === "supervisor") {
      const supervisorCount = await User.countDocuments({ role: "supervisor" });
      if (supervisorCount <= 1) {
        return res.status(400).json({
          error: "No se puede eliminar al último supervisor",
        });
      }
    }

    await user.deleteOne();

    res.json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      error: "Error al eliminar usuario",
    });
  }
};
