import Log from "../models/Log.js"

export const criarLog = async ({
  usuarioId,
  empresaId,
  acao,
  entidade,
  entidadeId,
  detalhes
}) => {

  try {

    await Log.create({
      usuarioId,
      empresaId,
      acao,
      entidade,
      entidadeId,
      detalhes
    });

  } catch (erro) {
    console.error("Erro ao salvar log:", erro.message);
  }

};