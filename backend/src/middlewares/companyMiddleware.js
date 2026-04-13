import Company from "../models/Company.js"
import User from "../models/User.js"

export const verificarEmpresa = async (req, res, next) => {

  try {

    const usuario = await User.findById(req.usuarioId)

    if (!usuario) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      })
    }

    if (!usuario.empresaId) {
      return res.status(403).json({
        message: "Empresa não criada"
      })
    }

    const empresa = await Company.findById(usuario.empresaId)

    if (!empresa) {
      return res.status(404).json({
        message: "Empresa não encontrada"
      })
    }

    if (empresa.status === "suspenso") {
      return res.status(403).json({
        success: false,
        message: "Sistema bloqueado. Pagamento pendente."
      });
    }

    const hoje = new Date();

    // TRIAL EXPIRADO
    if (
      empresa.plano === "trial" &&
      empresa.trialFim &&
      hoje > new Date(empresa.trialFim)
    ) {
      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Trial expirado. Efetue o pagamento."
      });
    }

    // PLANO EXPIRADO
    if (
      empresa.plano !== "trial" &&
      empresa.dataExpiracaoPlano &&
      hoje > new Date(empresa.dataExpiracaoPlano)
    ) {
      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Plano expirado. Efetue o pagamento."
      });
    }

    req.empresaId = empresa._id

    next()

  } catch (erro) {
    next(erro)
  }
}