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
    
    if (!res.success) {
      throw new Error(res?.message)
    }

    updateToast(toast, res?.message|| "Verifica teu email", "sucesso", 5000)

  } catch (err) {
    updateToast(toast, err.message || "Erro inesperado no envio", "erro");
    console.error(err);
  }
};