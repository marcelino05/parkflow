import { createToast, updateToast } from "../utils/toast.js"
const API = "http://localhost:5000/api/session"
const token = localStorage.getItem("token")
const user = JSON.parse(localStorage.getItem("user"))
const toast = createToast("Carregando dados do estacionamento...")

if (user.role === "operador") {
  document.getElementById("select-parking").style.display = "none"
  
  document.querySelectorAll(".only-admin").forEach(a=>{
    a.remove()
  })
}

if (!token) {
  updateToast(toast, "Sessão expirada ou não autenticado. Faça login para continuar", "erro")
  
  setTimeout(() => {
    window.location.href = "../auth/auth.html"
  }, 1500)
}

const getData = async () => {
  
  try {
    
    const res = await fetch(`${API}/vagas-disponiveis`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    })
    
    const data = await res.json()
    
    if (!data.success) {
      updateToast(toast, data.message, "erro")
      return
    }
    
    updateToast(toast, "Dados carregados com sucesso", "sucesso")
    
    document.getElementById("active").textContent = data.carrosAtivos
    document.getElementById("entry").textContent = data.entradas
    document.getElementById("available").textContent = data.vagasDisponiveis
    
    
  } catch (e) {
    updateToast(toast, e.message, "erro")
    throw new Error(e.message)
  }
  
}

getData()