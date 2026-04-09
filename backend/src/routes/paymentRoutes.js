import express from "express";
import {
  criarPedidoPagamento,
  confirmarPagamento
} from "../controllers/paymentController.js";

import {
  verificarToken
} from "../middlewares/authMiddleware.js";
import {
  verificarEmpresa
} from "../middlewares/companyMiddleware.js";
import {
  permitir
} from "../middlewares/roleMiddleware.js";

const router = express.Router();



// cliente envia (admin)
router.post("/pedido", verificarToken,  permitir("admin"), criarPedidoPagamento);

// só admin pode confirmar
router.post("/confirmar", verificarToken, permitir("admin"), confirmarPagamento);
export default router;