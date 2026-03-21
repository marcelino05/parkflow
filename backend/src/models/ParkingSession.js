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

  export default mongoose.model("ParkingSession", sessaoSchema);