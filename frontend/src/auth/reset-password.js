import { request } from "../utils/main.js";
import { createToast, updateToast } from "../utils/toast.js";

/* =========================
   TOKEN
========================= */
function getToken() {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

/* =========================
   ELEMENTOS
========================= */
const senha = document.getElementById("senha");
const confirmar = document.getElementById("confirmar");
const btn = document.getElementById("btn");

/* =========================
   CLICK
========================= */
btn.addEventListener("click", async () => {

  // cria toast APENAS quando necessário
  const toast = createToast("Aguardando...", "info");

  const novaSenha = senha.value.trim();
  const confirmarSenha = confirmar.value.trim();
  const token = getToken();

  /* =========================
     VALIDAÇÕES
  ========================= */

  if (!novaSenha || !confirmarSenha) {
    updateToast(toast, "Preencha todos os campos", "erro");
    return;
  }

  if (novaSenha.length < 6) {
    updateToast(toast, "A senha deve ter pelo menos 6 caracteres", "erro");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    updateToast(toast, "As senhas não coincidem", "erro");
    return;
  }

  if (!token) {
    updateToast(toast, "Token inválido ou expirado", "erro");
    return;
  }

  /* =========================
     PROCESSO
  ========================= */

  updateToast(toast, "Atualizando senha...", "info");

  try {
    const data = await request(
      `/auth/reset-password/${token}`,
      "POST",
      { senha: novaSenha },
      false
    );

    if (!data || !data.success) {
      updateToast(toast, data?.message || "Erro ao redefinir senha", "erro");
      return;
    }
  
    updateToast(toast, "Senha redefinida com sucesso", "sucesso");

    setTimeout(() => {
      window.location.href = "../auth/auth.html";
    }, 1500);

  } catch (err) {
    updateToast(toast, "Erro de conexão com servidor", "erro");
  }

});