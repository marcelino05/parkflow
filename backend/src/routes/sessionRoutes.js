import express from "express"
import {
  registrarEntrada,
  registrarSaida,
  listarHistorico,
  contarCarrosAtivos,
  vagasDisponiveis,
  receitaTotal,
  dashboard,
  receitaPorPeriodo
} from "../controllers/sessionController.js"

import {
  verificarToken
} from "../middlewares/authMiddleware.js"
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js"
import {
  permitir
} from "../middlewares/roleMiddleware.js";


const router = express.Router()

// proteger rotas
router.use(verificarToken, verificarEmpresa)

// operador pode
router.post("/entrada", permitir("admin", "operador"), registrarEntrada);
router.post("/saida", permitir("admin", "operador"), registrarSaida);

// só admin
router.get("/receitaTotal", permitir("admin"), receitaTotal);
router.get("/dashboard", permitir("admin"), dashboard);
router.get("/receita", permitir("admin"), receitaPorPeriodo);

// ambos podem ver histórico (opcional)
router.get("/historico", permitir("admin", "operador"), listarHistorico);
router.get("/ativos", permitir("admin", "operador"), contarCarrosAtivos);
router.get("/vagas/:estacionamentoId", permitir("admin", "operador"), vagasDisponiveis);
export default router