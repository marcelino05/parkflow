import Log from "../models/Log.js";

export const listarLogs = async (req, res) => {
  try {

    const logs = await Log.find({
      empresaId: req.empresaId
    })
    .populate("usuarioId", "nome") // 👈 AQUI
    .sort({ criadoEm: -1 })
    .limit(50);

    res.json({
      success: true,
      logs
    });

  } catch (erro) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar logs"
    });
  }
};