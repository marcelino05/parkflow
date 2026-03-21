import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({

  nome: {
    type: String,
    required: true,
    trim: true
  },

  telefone: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  senha: {
    type: String,
    required: true,
    minlength: 6
  },
  
  role: {
    type: String,
    enum: ["admin", "operador"],
    default: "operador"
    },

    empresaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
    default: null
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,

    criadoEm: {
      type: Date,
    default: Date.now
    }

  });

  export default mongoose.model("User", usuarioSchema);