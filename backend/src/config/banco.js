import mongoose from "mongoose";

const conectarBanco = async()=> {
  try {
    await mongoose.connect(process.env.DB_MONGO)
    console.log("MongoDB conectado com sucesso")
  }catch(erro) {
    console.log("Falha ao conectar MongoDB: "+ erro.message)
    process.exist(1)
  }
}

export default conectarBanco;