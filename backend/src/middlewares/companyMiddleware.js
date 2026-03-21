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

    if (!empresa.trialFim) {
      return res.status(500).json({
        success: false, message: "Erro na configuração do trial"
      })
    }

    const hoje = new Date();
    const fimTrial = new Date(empresa.trialFim).getTime()

    // 🚨 TRIAL EXPIRADO
    if (empresa.plano === "trial" && empresa.trialFim && hoje > empresa.trialFim) {

      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Trial expirado. Efetue o pagamento."
      });
    }
    // plano pago expirado
    if (
      empresa.plano !== "trial" &&
      empresa.dataExpiracaoPlano &&
      hoje > empresa.dataExpiracaoPlano
    ) {

      empresa.status = "suspenso";
      await empresa.save();

      return res.status(403).json({
        success: false,
        message: "Plano expirado. Efetue o pagamento."
      });
    }
    // salvar no request
    req.empresaId = empresa._id

    next()

  } catch (erro) {
    next(erro)
  }
}