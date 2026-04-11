import express from "express";
import rateLimit from "express-rate-limit";

import {
  registrar,
  login,
  esqueciSenha,
  redefinirSenha
} from "../controllers/authController.js";

const loginLimiter = rateLimit( {
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente mais tarde."
  }
});

const router = express.Router();

// ROTAS AUTH
router.post("/registrar", registrar);
router.post("/login", loginLimiter, login);

// RECUPERAÇÃO DE SENHA
router.post("/esqueci-senha", esqueciSenha);
router.post("/resetar-senha/:token", redefinirSenha);

export default router;