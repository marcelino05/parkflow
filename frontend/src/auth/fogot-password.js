import { request } from "../utils/main.js";
import { createToast } from "../utils/toast.js";

const tema = JSON.parse(localStorage.getItem("tema"))
console.log(tema)

const toast = createToast("Pronto", "info");

window.enviar = async function() {
  const email = document.getElementById("email").value;
  
  if (!email) {
    toast.update("Email obrigatório", "error");
    return;
  }
  
  toast.update("Enviando link...", "info");
  
  const res = await request("/auth/esqueci-senha", "POST", { email });
  
  if (!res.success) {
    toast.update(res.message, "error");
    return;
  }
  
  toast.update("Verifica teu email 📩", "success");
};