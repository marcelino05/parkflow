import { request } from "../utils/main.js";
import { createToast, updateToast } from "../utils/toast.js";

window.enviar = async function() {
  const email = document.getElementById("email").value.trim();
  
  const toast = createToast("ParkFlow", "info");
  
  try {
    if (!email) {
      updateToast(toast, "Email obrigatório", "erro");
      return;
    }
    
    updateToast(toast, "Enviando link...", "info");
    
    const res = await request("/auth/esqueci-senha", "POST", { email });
    
    if (!res || res.success === false) {
      updateToast(toast, res?.message || "Erro ao enviar email", "erro");
      return;
    }
    
    updateToast(toast, "Verifica teu email", "sucesso");
    
  } catch (err) {
    updateToast(toast, "Erro inesperado no envio", "erro");
    console.error(err);
  }
};