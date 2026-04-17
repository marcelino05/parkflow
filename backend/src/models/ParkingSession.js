import mongoose from "mongoose";

const sessaoSchema = new mongoose.Schema({
  placa: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  estacionamentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parking",
    required: true
  },

  operadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  empresaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  horaEntrada: {
    type: Date,
    required: true
  },

  horaSaida: {
    type: Date
  },

  valorCobrado: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["ativo", "finalizado"],
    default: "ativo"
  },

  criadoEm: {
    type: Date,
    default: Date.now
  }
});

/* =========================================
   ÍNDICES (CORRETO LOCAL)
========================================= */

sessaoSchema.index({ empresaId: 1, status: 1 });
sessaoSchema.index({ estacionamentoId: 1, status: 1 });
sessaoSchema.index({ placa: 1, status: 1 });

export default mongoose.model("ParkingSession", sessaoSchema);