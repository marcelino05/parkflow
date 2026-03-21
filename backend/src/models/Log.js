import mongoose from "mongoose"

const logSchema = new mongoose.Schema({

  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  acao: {
    type: String,
    required: true
  },

  entidade: {
    type: String
  },

  entidadeId: {
    type: mongoose.Schema.Types.ObjectId
  },

  detalhes: {
    type: Object
  },

  criadoEm: {
    type: Date,
    default: Date.now
  }

})

export default mongoose.model("Log", logSchema)