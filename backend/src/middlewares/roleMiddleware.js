import User from "../models/User.js";

export const verificarAdmin = async (req, res, next) => {
  try {
console.log("req.usuarioId:", req.usuarioId);
    if (!req.usuarioId) {
      return res.status(401).json({
        success: false,
        message: "Token inválido"
      });
    }

    const usuario = await User.findById(req.usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    if (usuario.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso permitido apenas para administradores"
      });
    }

    next();

  } catch (erro) {
    return res.status(500).json({
      success: false,
      message: "Erro interno: " + erro.message
    });
  }
};


export const permitir = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {

      if (!req.usuarioId) {
        return res.status(401).json({
          success: false,
          message: "Token inválido"
        });
      }

      const usuario = await User.findById(req.usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }

      if (!rolesPermitidos.includes(usuario.role)) {
        return res.status(403).json({
          success: false,
          message: "Sem permissão"
        });
      }

      next();

    } catch (erro) {
      return res.status(500).json({
        success: false,
        message: "Erro interno: " + erro.message
      });
    }
  };
};