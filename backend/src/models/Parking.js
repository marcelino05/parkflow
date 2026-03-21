import mongoose from "mongoose"

const estacionamentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  endereco: {
    type: String,
    required: true
  },
  totalVaga: {
    type: Number,
    required: true
  },
  precoPorHora: {
    type: Number,
    required: true
  },
  vagasOcupadas: {
    type: Number,
    default: 0
    },
    empresaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    criadoEm: {
      type: Date,
    default: Date.now
    }
  })

  export default mongoose.model("Parking", estacionamentoSchema)