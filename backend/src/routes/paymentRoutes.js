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

// CLIENTE (ADMIN DA EMPRESA) CRIA PEDIDO
router.post("/pedido", verificarToken, verificarEmpresa, permitir("admin"), criarPedidoPagamento);

//  CONFIRMAÇÃO (MVP CONTROLADO POR TI)
router.post("/confirmar", verificarToken, permitir("admin"), confirmarPagamento);

export default router;