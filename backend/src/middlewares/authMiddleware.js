import jwt from "jsonwebtoken";

export const verificarToken = async(req, res, next)=> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,message: "Token não fornecido ou inválido."
    });
  }
  const token = authHeader.split(" ")[1]

  try {
    const decodificado = jwt.verify(token, process.env.SECRET_KEY)
    req.usuarioId = decodificado.id

    next()

  }catch(erro) {
    res.status(500).json({
      success: false, message: "Token inválido: " + erro.message
    });
  };
};

export const errorHandler = (erro, req, res, next) => {

  if (erro.code === 11000) {
    return res.status(409).json({
      success: false, message: "Email ou telefone já cadastrado"
    })
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(500).json({
      success: false, message: erro.message,
      stack: erro.stack
    })
  }

  res.status(500).json({
    success: false, message: "Erro interno do servidor: " + erro.message
  })
}