const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entrada
    if (!username || !password) {
      return res.status(400).json({
        error: "Usuario y contraseña son requeridos",
      });
    }

    // Buscar usuario
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Enviar respuesta
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      error: "Error al iniciar sesión",
    });
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
    const { username, password, role } = req.body;

    // Validar entrada
    if (!username || !password || !role) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "El usuario ya existe",
      });
    }

    // Crear usuario
    const user = new User({
      username,
      password,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({
      error: "Error al crear usuario",
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
