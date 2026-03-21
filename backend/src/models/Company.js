import mongoose from "mongoose";

const empresaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  telefone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true
  },
  endereco: {
    type: String,
    default: "Não definido"
    },
    proprietarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    plano: {
      type: String,
      enum: ["trial", "basico", "pro"],
    default: "trial"
    },
    status: {
      type: String,
      enum: ["ativo", "suspenso"],
    default: "ativo"
    },
    trialInicio: {
      type: Date
    },
    trialFim: {
      type: Date
    },
    planoAtivo: {
      type: Boolean,
    default: true
    },
    dataExpiracaoPlano: {
      type: Date
    },
    criadoEm: {
      type: Date,
    default: Date.now
    }
  });

  export default mongoose.model("Company", empresaSchema);