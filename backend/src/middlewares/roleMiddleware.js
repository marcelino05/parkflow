import User from "../models/User.js";

export const verificarAdmin = async (req, res, next) => {

  const usuario = await User.findById(req.usuarioId);

  if (usuario.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso permitido apenas para administradores"
    });
  }

  next();
}; 

export const permitir = (...rolesPermitidos) => {
  return async (req, res, next) => {

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
  };
};