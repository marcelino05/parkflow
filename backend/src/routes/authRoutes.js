import express from "express";
import rateLimit from "express-rate-limit";
//Importação de controle de autenticação
import {
  registrar,
  login
} from "../controllers/authController.js"

const loginLimiter = rateLimit( {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente mais tarde."
  }
});

const router = express.Router()

//ROTAS do autenticação
router.post("/registrar", registrar)
router.post("/login", loginLimiter, login)

export default router;