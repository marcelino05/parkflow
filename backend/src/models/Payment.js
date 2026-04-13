import mongoose from "mongoose";

const pagamentoSchema = new mongoose.Schema({

  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  plano: {
    type: String,
    enum: ["trial", "basico", "pro", "premium"],
    required: true
  },

  valor: {
    type: Number,
    required: true
  },

  metodo: {
    type: String,
    enum: ["mpesa", "emola", "mkesh"],
    required: true
  },

  comprovante: {
    type: String
  },

  status: {
    type: String,
    enum: ["pendente", "confirmado", "rejeitado"],
    default: "pendente"
  },

  criadoEm: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Payment", pagamentoSchema);