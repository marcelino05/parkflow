import conectarBanco from "./config/banco.js"
import app from "./app.js"

const porta = process.env.PORTA || 5000

async function iniciarServidor() {
  try {

    await conectarBanco()

    app.listen(porta, ()=> {
      console.log("Servidor rodando na porta:", porta)
    })

  }catch(erro) {
    console.error("Falha ao iniciar servidor:", erro.message)
    process.exit(1)
  }
}

iniciarServidor()