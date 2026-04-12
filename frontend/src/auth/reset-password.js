import { createToast, updateToast } from "../utils/toast.js";

/* =========================
   BASE URL
========================= */
const BASE_URL = "http://localhost:5000/api";

/* =========================
   TOKEN DA URL
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
   RESET PASSWORD (FETCH PURO)
========================= */
async function resetPassword(token, novaSenha) {
  try {
    const response = await fetch(`${BASE_URL}/auth/resetar-senha/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        senha: novaSenha
      })
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      ...data
    };
    
  } catch (error) {
    console.error("ERRO FETCH:", error);
    return {
      success: false,
      message: "Erro de conexão com servidor"
    };
  }
}

/* =========================
   EVENTO BOTÃO
========================= */
btn.addEventListener("click", async () => {
  
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
  
  const result = await resetPassword(token, novaSenha);
  
  console.log("RESULTADO:", result);
  
  if (!result || !result.success) {
    updateToast(
      toast,
      result?.message || "Erro ao redefinir senha",
      "erro"
    );
    return;
  }
  
  updateToast(toast, "Senha redefinida com sucesso", "sucesso");
  
  setTimeout(() => {
    window.location.href = "../auth/auth.html";
  }, 1500);
});